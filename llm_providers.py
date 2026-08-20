"""
Pluggable LLM backends for the GoodFoods reservation agent.

Every provider implements one method:

    provider.chat(messages, tools) -> {
        "choices": [{"message": {...}, "finish_reason": "stop"}]
    }

`messages` is always an OpenAI-style list (system / user / assistant / tool
roles) and the returned `message` may contain "content" and/or "tool_calls"
in OpenAI shape. Each provider is responsible for translating that canonical
format into and out of its own wire protocol, so `ReservationAgent` never has
to know which backend is in use.

Built from scratch on `requests` - no vendor SDKs required.
"""
import json
from ipaddress import ip_address
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import requests

from config import (
    DEBUG,
    GEMINI,
    GEMINI_API_BASE,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    MAX_OUTPUT_TOKENS,
    NUM_CTX,
    OLLAMA,
    OLLAMA_API_ENDPOINT,
    OLLAMA_HOST,
    OLLAMA_KEEP_ALIVE,
    OLLAMA_MODEL,
    OPENAI,
    OPENAI_COMPATIBLE_PROVIDERS,
    OPENAI_MODEL,
    PROVIDER_LABELS,
    REPEAT_PENALTY,
    REQUEST_TIMEOUT,
    TEMPERATURE,
    TOP_P,
    LLM_PROVIDER,
    get_openai_compatible_config,
    normalize_provider,
)


class LLMError(Exception):
    """Raised when an LLM backend cannot fulfil a request."""


def _as_dict(value: Any) -> Dict[str, Any]:
    """Coerce tool-call arguments into a dict (providers disagree on the type)."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def _as_json_str(value: Any) -> str:
    """Coerce tool-call arguments into a JSON string (required by OpenAI)."""
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value or {})
    except (TypeError, ValueError):
        return "{}"


def _tool_response(value: Any) -> Dict[str, Any]:
    """Return Gemini's required object-shaped function response."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
    return {"result": value if isinstance(value, str) else str(value or "")}


def _is_local_endpoint(url: str) -> bool:
    """Whether an endpoint is a loopback URL that may omit authentication."""
    try:
        host = urlparse(url).hostname
    except ValueError:
        return False
    if not host:
        return False
    if host.lower() == "localhost":
        return True
    try:
        return ip_address(host).is_loopback
    except ValueError:
        return False


def _describe_http_error(provider: str, response: requests.Response) -> str:
    """Build an actionable message from a failed HTTP response."""
    detail = ""
    try:
        body = response.json()
        if isinstance(body, dict):
            error = body.get("error")
            if isinstance(error, dict):
                detail = error.get("message") or ""
            elif isinstance(error, str):
                detail = error
            detail = detail or body.get("message") or ""
    except ValueError:
        detail = (response.text or "").strip()

    detail = detail[:400]
    return "{0} API error {1}{2}".format(
        provider, response.status_code, ": " + detail if detail else ""
    )


class LLMProvider:
    """Base class defining the contract shared by all backends."""

    name = "base"
    label = "Base"
    requires_api_key = False

    def __init__(self, model: Optional[str] = None):
        self.model = (model or "").strip() or self.default_model()
        self.endpoint = ""

    @staticmethod
    def default_model() -> str:
        raise NotImplementedError

    def chat(self, messages: List[Dict], tools: Optional[List[Dict]] = None) -> Dict:
        raise NotImplementedError

    def is_configured(self) -> Tuple[bool, str]:
        """Return (ready, human readable reason) without spending any quota."""
        return True, "Ready"

    def describe(self) -> str:
        return "{0} - {1}".format(self.label, self.model)

    def _post(self, url: str, payload: Dict, headers: Optional[Dict] = None) -> Dict:
        """POST JSON and return the decoded body, raising LLMError on failure."""
        try:
            response = requests.post(
                url, json=payload, headers=headers or {}, timeout=REQUEST_TIMEOUT
            )
        except requests.exceptions.Timeout:
            raise LLMError(
                "{0} request timed out after {1}s.".format(self.label, REQUEST_TIMEOUT)
            )
        except requests.exceptions.ConnectionError as exc:
            raise LLMError(
                "Could not reach {0} at {1}. {2}".format(self.label, url, exc)
            )
        except requests.exceptions.RequestException as exc:
            raise LLMError("{0} request failed: {1}".format(self.label, exc))

        if not response.ok:
            raise LLMError(_describe_http_error(self.label, response))

        try:
            data = response.json()
        except ValueError:
            raise LLMError(
                "{0} returned a non-JSON response: {1}".format(
                    self.label, (response.text or "")[:200]
                )
            )

        if DEBUG:
            print("[DEBUG] {0} response received".format(self.name))

        return data


# ---------------------------------------------------------------------------
# Ollama - local models (qwen2.5, llama3.1, ...)
# ---------------------------------------------------------------------------


class OllamaProvider(LLMProvider):
    """Local inference through the Ollama /api/chat endpoint."""

    name = OLLAMA
    label = "Ollama"

    def __init__(self, model: Optional[str] = None, endpoint: Optional[str] = None):
        super().__init__(model)
        self.endpoint = endpoint or OLLAMA_API_ENDPOINT

    @staticmethod
    def default_model() -> str:
        return OLLAMA_MODEL

    def chat(self, messages: List[Dict], tools: Optional[List[Dict]] = None) -> Dict:
        options = {
            "temperature": TEMPERATURE,
            "top_p": TOP_P,
            "repeat_penalty": REPEAT_PENALTY,
            "num_ctx": NUM_CTX,
        }
        if MAX_OUTPUT_TOKENS > 0:
            options["num_predict"] = MAX_OUTPUT_TOKENS

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "keep_alive": OLLAMA_KEEP_ALIVE,
            "options": options,
        }
        if tools:
            payload["tools"] = tools

        data = self._post(self.endpoint, payload)

        message = data.get("message") or {}
        normalized = {"role": "assistant", "content": message.get("content") or ""}

        tool_calls = []
        for index, call in enumerate(message.get("tool_calls") or []):
            function = call.get("function") or {}
            tool_calls.append(
                {
                    "id": call.get("id") or "call_{0}".format(index),
                    "type": "function",
                    "function": {
                        "name": function.get("name", ""),
                        "arguments": function.get("arguments") or {},
                    },
                }
            )
        if tool_calls:
            normalized["tool_calls"] = tool_calls

        return {
            "choices": [
                {
                    "message": normalized,
                    "finish_reason": "tool_calls" if tool_calls else "stop",
                }
            ]
        }

    def is_configured(self) -> Tuple[bool, str]:
        """Ping the Ollama daemon and confirm the model has been pulled."""
        try:
            response = requests.get(OLLAMA_HOST + "/api/tags", timeout=3)
            response.raise_for_status()
            names = [m.get("name", "") for m in response.json().get("models", [])]
        except requests.exceptions.RequestException:
            return False, "Ollama is not reachable at {0}".format(OLLAMA_HOST)
        except ValueError:
            return True, "Ollama is running"

        if names and not any(
            n == self.model or n.split(":")[0] == self.model.split(":")[0]
            for n in names
        ):
            return False, "Model '{0}' is not pulled (run: ollama pull {0})".format(
                self.model
            )
        return True, "Ollama is running"


# ---------------------------------------------------------------------------
# Google Gemini
# ---------------------------------------------------------------------------

# Keys accepted by the Gemini Schema object. Anything else (default,
# additionalProperties, $schema, ...) makes the API reject the request.
_GEMINI_SCHEMA_KEYS = frozenset(
    [
        "type",
        "format",
        "description",
        "nullable",
        "enum",
        "items",
        "properties",
        "required",
        "minimum",
        "maximum",
        "minItems",
        "maxItems",
    ]
)

_GEMINI_FINISH_REASONS = {
    "STOP": "stop",
    "MAX_TOKENS": "length",
    "SAFETY": "content_filter",
    "RECITATION": "content_filter",
    "PROHIBITED_CONTENT": "content_filter",
}


def _to_gemini_schema(schema: Any) -> Optional[Dict]:
    """Convert a JSON Schema fragment into Gemini's OpenAPI subset.

    Returns None when the fragment carries no usable information, which lets
    callers omit it entirely - Gemini rejects an OBJECT schema that has no
    properties, so zero-argument tools must not declare `parameters` at all.
    """
    if not isinstance(schema, dict):
        return None

    cleaned: Dict[str, Any] = {}
    for key, value in schema.items():
        if key not in _GEMINI_SCHEMA_KEYS:
            continue

        if key == "type" and isinstance(value, str):
            cleaned["type"] = value.upper()
        elif key == "properties" and isinstance(value, dict):
            properties = {}
            for prop_name, prop_schema in value.items():
                converted = _to_gemini_schema(prop_schema)
                if converted:
                    properties[prop_name] = converted
            if properties:
                cleaned["properties"] = properties
        elif key == "items":
            converted = _to_gemini_schema(value)
            if converted:
                cleaned["items"] = converted
        elif key == "enum" and isinstance(value, list):
            cleaned["enum"] = [str(item) for item in value]
        elif key == "required" and isinstance(value, list):
            cleaned["required"] = list(value)
        else:
            cleaned[key] = value

    if cleaned.get("type") == "OBJECT" and not cleaned.get("properties"):
        return None

    required = cleaned.get("required")
    if required is not None:
        allowed = cleaned.get("properties") or {}
        kept = [item for item in required if item in allowed]
        if kept:
            cleaned["required"] = kept
        else:
            cleaned.pop("required")

    return cleaned or None


class GeminiProvider(LLMProvider):
    """Google Gemini via the generateContent REST endpoint.

    Gemini differs from OpenAI in four ways that matter here: the system prompt
    is a top-level `systemInstruction`, turns are called `contents` with roles
    user/model only, tool calls are `functionCall` parts, and tool results are
    `functionResponse` parts matched by function *name* rather than call id.
    """

    name = GEMINI
    label = "Gemini"
    requires_api_key = True

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
    ):
        super().__init__(model)
        self.api_key = (api_key or GEMINI_API_KEY or "").strip()
        self.api_base = (api_base or GEMINI_API_BASE).rstrip("/")
        self.endpoint = "{0}/models/{1}:generateContent".format(
            self.api_base, self.model
        )

    @staticmethod
    def default_model() -> str:
        return GEMINI_MODEL

    def is_configured(self) -> Tuple[bool, str]:
        if not self.api_key:
            return False, "GEMINI_API_KEY is not set (get one at aistudio.google.com/apikey)"
        return True, "API key detected"

    @staticmethod
    def _append(contents: List[Dict], role: str, parts: List[Dict]) -> None:
        """Append parts, merging into the previous turn if the role repeats."""
        if not parts:
            return
        if contents and contents[-1]["role"] == role:
            contents[-1]["parts"].extend(parts)
        else:
            contents.append({"role": role, "parts": parts})

    def _build_contents(self, messages: List[Dict]) -> Tuple[List[Dict], str]:
        contents: List[Dict] = []
        system_chunks: List[str] = []

        for message in messages:
            role = message.get("role")
            content = message.get("content") or ""

            if role == "system":
                if content:
                    system_chunks.append(content)

            elif role == "user":
                self._append(contents, "user", [{"text": content}] if content else [])

            elif role == "assistant":
                parts: List[Dict] = []
                if content:
                    parts.append({"text": content})
                for call in message.get("tool_calls") or []:
                    function = call.get("function") or {}
                    fc: Dict[str, Any] = {
                        "name": function.get("name", ""),
                        "args": _as_dict(function.get("arguments")),
                    }
                    thought_sig = (
                        function.get("thought_signature")
                        or function.get("thoughtSignature")
                        or call.get("thought_signature")
                        or call.get("thoughtSignature")
                    )
                    if thought_sig:
                        fc["thought_signature"] = thought_sig
                    for k in ("thought", "thoughtSignature"):
                        if k in function and k not in fc:
                            fc[k] = function[k]
                        elif k in call and k not in fc:
                            fc[k] = call[k]
                    parts.append({"functionCall": fc})
                self._append(contents, "model", parts)

            elif role in ("tool", "function"):
                # Gemini pairs responses to calls by name, and `response` must
                # be a JSON object rather than a bare string.
                self._append(
                    contents,
                    "user",
                    [
                        {
                            "functionResponse": {
                                "name": message.get("name") or "tool",
                                "response": _tool_response(content),
                            }
                        }
                    ],
                )

        if not contents:
            # Gemini requires at least one turn; fall back to the system text.
            contents.append(
                {"role": "user", "parts": [{"text": " ".join(system_chunks) or "Hello"}]}
            )

        return contents, "\n\n".join(system_chunks)

    @staticmethod
    def _build_tools(tools: Optional[List[Dict]]) -> Optional[List[Dict]]:
        declarations = []
        for tool in tools or []:
            function = tool.get("function") or {}
            name = function.get("name")
            if not name:
                continue

            declaration: Dict[str, Any] = {
                "name": name,
                "description": function.get("description", ""),
            }
            parameters = _to_gemini_schema(function.get("parameters"))
            if parameters:
                declaration["parameters"] = parameters
            declarations.append(declaration)

        return [{"functionDeclarations": declarations}] if declarations else None

    def chat(self, messages: List[Dict], tools: Optional[List[Dict]] = None) -> Dict:
        if not self.api_key:
            raise LLMError(
                "GEMINI_API_KEY is not set. Add it to your .env file or export it, "
                "then restart the app. Create a free key at "
                "https://aistudio.google.com/apikey"
            )

        contents, system_instruction = self._build_contents(messages)

        generation_config: Dict[str, Any] = {
            "temperature": TEMPERATURE,
            "topP": TOP_P,
        }
        if MAX_OUTPUT_TOKENS > 0:
            generation_config["maxOutputTokens"] = MAX_OUTPUT_TOKENS

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": generation_config,
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        gemini_tools = self._build_tools(tools)
        if gemini_tools:
            payload["tools"] = gemini_tools

        data = self._post(
            self.endpoint,
            payload,
            headers={
                "x-goog-api-key": self.api_key,
                "Content-Type": "application/json",
            },
        )

        return self._normalize(data)

    @staticmethod
    def _normalize(data: Dict) -> Dict:
        candidates = data.get("candidates") or []
        if not candidates:
            block = (data.get("promptFeedback") or {}).get("blockReason")
            raise LLMError(
                "Gemini returned no candidates"
                + (" (blocked: {0})".format(block) if block else "")
            )

        candidate = candidates[0]
        parts = (candidate.get("content") or {}).get("parts") or []

        text_chunks: List[str] = []
        tool_calls: List[Dict] = []

        for part in parts:
            text = part.get("text")
            if text:
                text_chunks.append(text)

            function_call = part.get("functionCall")
            if function_call:
                fc_obj: Dict[str, Any] = {
                    "name": function_call.get("name", ""),
                    "arguments": function_call.get("args") or {},
                }
                for key in ("thought_signature", "thoughtSignature", "thought"):
                    val = function_call.get(key) or part.get(key)
                    if val:
                        fc_obj[key] = val

                tool_call: Dict[str, Any] = {
                    "id": "call_{0}".format(len(tool_calls)),
                    "type": "function",
                    "function": fc_obj,
                }
                sig = (
                    function_call.get("thought_signature")
                    or function_call.get("thoughtSignature")
                    or part.get("thought_signature")
                    or part.get("thoughtSignature")
                )
                if sig:
                    tool_call["thought_signature"] = sig
                tool_calls.append(tool_call)

        message: Dict[str, Any] = {"role": "assistant", "content": "".join(text_chunks)}
        if tool_calls:
            message["tool_calls"] = tool_calls

        finish_reason = _GEMINI_FINISH_REASONS.get(
            candidate.get("finishReason", "STOP"), "stop"
        )
        if tool_calls:
            finish_reason = "tool_calls"

        return {"choices": [{"message": message, "finish_reason": finish_reason}]}


# ---------------------------------------------------------------------------
# OpenAI-compatible endpoints
# ---------------------------------------------------------------------------


class OpenAICompatibleProvider(LLMProvider):
    """Any service exposing POST /chat/completions in OpenAI's format.

    Covers OpenAI itself plus Groq, OpenRouter, Together, Fireworks, DeepSeek,
    LM Studio and vLLM - only the base URL, key and model id change.
    """

    name = OPENAI
    label = "OpenAI-compatible"
    requires_api_key = True

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        provider: Optional[str] = None,
    ):
        service = provider or (
            LLM_PROVIDER if LLM_PROVIDER in OPENAI_COMPATIBLE_PROVIDERS else OPENAI
        )
        service = normalize_provider(service)
        settings = get_openai_compatible_config(service)
        self.name = service
        self.label = PROVIDER_LABELS[service]
        super().__init__(model or settings["model"])
        self.api_key = (settings["api_key"] if api_key is None else api_key).strip()
        self.endpoint = self._resolve_endpoint(
            settings["api_base"] if api_base is None else api_base
        )

    @staticmethod
    def default_model() -> str:
        return OPENAI_MODEL

    @staticmethod
    def _resolve_endpoint(api_base: str) -> str:
        base = (api_base or "").strip().rstrip("/")
        if not base:
            return "https://api.openai.com/v1/chat/completions"
        if base.endswith("/chat/completions"):
            return base
        return base + "/chat/completions"

    def _api_key_hint(self) -> str:
        return "{}_API_KEY".format(self.name.upper())

    def is_configured(self) -> Tuple[bool, str]:
        if not self.api_key and not _is_local_endpoint(self.endpoint):
            return False, "{} is not set".format(self._api_key_hint())
        return True, "Endpoint configured"

    @staticmethod
    def _prepare_messages(messages: List[Dict]) -> List[Dict]:
        """Normalize messages to what the OpenAI schema strictly accepts."""
        prepared = []
        for message in messages:
            role = message.get("role")

            if role == "tool":
                prepared.append(
                    {
                        "role": "tool",
                        "tool_call_id": message.get("tool_call_id", ""),
                        "content": message.get("content") or "",
                    }
                )
                continue

            if role == "assistant" and message.get("tool_calls"):
                calls = []
                for index, call in enumerate(message["tool_calls"]):
                    function = call.get("function") or {}
                    calls.append(
                        {
                            "id": call.get("id") or "call_{0}".format(index),
                            "type": "function",
                            "function": {
                                "name": function.get("name", ""),
                                # OpenAI requires arguments as a JSON string.
                                "arguments": _as_json_str(function.get("arguments")),
                            },
                        }
                    )
                prepared.append(
                    {
                        "role": "assistant",
                        "content": message.get("content") or "",
                        "tool_calls": calls,
                    }
                )
                continue

            prepared.append({"role": role, "content": message.get("content") or ""})

        return prepared

    def chat(self, messages: List[Dict], tools: Optional[List[Dict]] = None) -> Dict:
        if not self.api_key and not _is_local_endpoint(self.endpoint):
            raise LLMError(
                "{} is not set. Add it to your .env file or export it, then restart "
                "the app.".format(self._api_key_hint())
            )

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": self._prepare_messages(messages),
            "stream": False,
            "temperature": TEMPERATURE,
            "top_p": TOP_P,
        }
        if MAX_OUTPUT_TOKENS > 0:
            payload["max_tokens"] = MAX_OUTPUT_TOKENS
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = "Bearer " + self.api_key

        data = self._post(self.endpoint, payload, headers=headers)

        choices = data.get("choices") or []
        if not choices:
            raise LLMError("{0} returned no choices".format(self.label))

        choice = choices[0]
        message = choice.get("message") or {}
        normalized: Dict[str, Any] = {
            "role": "assistant",
            "content": message.get("content") or "",
        }

        tool_calls = []
        for index, call in enumerate(message.get("tool_calls") or []):
            function = call.get("function") or {}
            tool_calls.append(
                {
                    "id": call.get("id") or "call_{0}".format(index),
                    "type": "function",
                    "function": {
                        "name": function.get("name", ""),
                        "arguments": function.get("arguments") or {},
                    },
                }
            )
        if tool_calls:
            normalized["tool_calls"] = tool_calls

        return {
            "choices": [
                {
                    "message": normalized,
                    "finish_reason": choice.get("finish_reason") or "stop",
                }
            ]
        }


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

PROVIDER_REGISTRY = {
    OLLAMA: OllamaProvider,
    GEMINI: GeminiProvider,
    **{
        provider: OpenAICompatibleProvider
        for provider in OPENAI_COMPATIBLE_PROVIDERS
    },
}


def create_provider(
    provider: Optional[str] = None, model: Optional[str] = None
) -> LLMProvider:
    """Instantiate the configured provider."""
    key = normalize_provider(provider or LLM_PROVIDER)
    provider_class = PROVIDER_REGISTRY[key]
    if key in OPENAI_COMPATIBLE_PROVIDERS:
        return provider_class(model=model, provider=key)
    return provider_class(model=model)
