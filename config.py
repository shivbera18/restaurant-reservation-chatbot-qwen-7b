"""
Application and LLM configuration.

Settings can be overridden by environment variables or a `.env` file next to
this module. OpenAI-compatible services share one HTTP implementation; their
provider name only selects sensible endpoint, key, and model defaults.
"""
import os

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
except ImportError:  # Plain environment variables still work without dotenv.
    pass


def _env_str(name: str, default: str = "") -> str:
    value = os.getenv(name)
    return value.strip() if value and value.strip() else default


def _env_float(name: str, default: float) -> float:
    try:
        return float(_env_str(name, str(default)))
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(_env_str(name, str(default)))
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    raw = _env_str(name, "").lower()
    return default if not raw else raw in ("1", "true", "yes", "on")


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------

OLLAMA = "ollama"
GEMINI = "gemini"
OPENAI = "openai"

# These all expose OpenAI's /chat/completions protocol. For any other
# compatible service, use LLM_PROVIDER=openai with OPENAI_API_BASE set to it.
OPENAI_COMPATIBLE_PROVIDERS = {
    OPENAI: {
        "label": "OpenAI API",
        "api_base": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
        "models": ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    },
    "groq": {
        "label": "Groq API",
        "api_base": "https://api.groq.com/openai/v1",
        "model": "openai/gpt-oss-120b",
        "models": ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"],
    },
    "openrouter": {
        "label": "OpenRouter API",
        "api_base": "https://openrouter.ai/api/v1",
        "model": "google/gemini-2.5-flash",
        "models": ["google/gemini-2.5-flash", "openai/gpt-4o-mini"],
    },
    "together": {
        "label": "Together AI",
        "api_base": "https://api.together.xyz/v1",
        "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "models": ["meta-llama/Llama-3.3-70B-Instruct-Turbo"],
    },
    "deepseek": {
        "label": "DeepSeek API",
        "api_base": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
        "models": ["deepseek-chat", "deepseek-reasoner"],
    },
    "fireworks": {
        "label": "Fireworks AI",
        "api_base": "https://api.fireworks.ai/inference/v1",
        "model": "accounts/fireworks/models/llama-v3p3-70b-instruct",
        "models": ["accounts/fireworks/models/llama-v3p3-70b-instruct"],
    },
    "lmstudio": {
        "label": "LM Studio (local)",
        "api_base": "http://localhost:1234/v1",
        "model": "local-model",
        "models": [],
    },
    "vllm": {
        "label": "vLLM (local)",
        "api_base": "http://localhost:8000/v1",
        "model": "local-model",
        "models": [],
    },
}

SUPPORTED_PROVIDERS = (OLLAMA, GEMINI, *OPENAI_COMPATIBLE_PROVIDERS)

PROVIDER_ALIASES = {
    "google": GEMINI,
    "google-gemini": GEMINI,
    "googleai": GEMINI,
    "gemini-api": GEMINI,
    "openai-compatible": OPENAI,
    "openai_compatible": OPENAI,
    "lm-studio": "lmstudio",
    "lm_studio": "lmstudio",
    "local": OLLAMA,
    "qwen": OLLAMA,
}


def normalize_provider(name: str) -> str:
    """Validate a provider name and resolve documented aliases."""
    key = PROVIDER_ALIASES.get((name or "").strip().lower(), (name or "").strip().lower())
    if key in SUPPORTED_PROVIDERS:
        return key
    raise ValueError(
        "Unsupported LLM provider {!r}. Choose one of: {}".format(
            name, ", ".join(SUPPORTED_PROVIDERS)
        )
    )


LLM_PROVIDER = normalize_provider(_env_str("LLM_PROVIDER", OLLAMA))


# ---------------------------------------------------------------------------
# Ollama and Gemini
# ---------------------------------------------------------------------------

OLLAMA_HOST = _env_str("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
OLLAMA_API_ENDPOINT = _env_str("OLLAMA_API_ENDPOINT", OLLAMA_HOST + "/api/chat")
# LLM_MODEL is honoured for backwards compatibility with the original config.
OLLAMA_MODEL = _env_str("OLLAMA_MODEL", _env_str("LLM_MODEL", "qwen2.5:7b"))
OLLAMA_KEEP_ALIVE = _env_str("OLLAMA_KEEP_ALIVE", "10m")

GEMINI_API_KEY = _env_str("GEMINI_API_KEY", _env_str("GOOGLE_API_KEY"))
GEMINI_MODEL = _env_str("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_BASE = _env_str(
    "GEMINI_API_BASE", "https://generativelanguage.googleapis.com/v1beta"
).rstrip("/")


# ---------------------------------------------------------------------------
# OpenAI-compatible endpoints
# ---------------------------------------------------------------------------

# Generic settings configure OpenAI or a custom compatible endpoint. Named
# services use their own API key but may inherit a custom model or base URL.
OPENAI_API_KEY = _env_str("OPENAI_API_KEY")
OPENAI_MODEL = _env_str("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_BASE = _env_str("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")


def get_openai_compatible_config(provider: str) -> dict:
    """Return env-overridable settings for one OpenAI-compatible service."""
    provider = normalize_provider(provider)
    if provider not in OPENAI_COMPATIBLE_PROVIDERS:
        raise ValueError("{} is not an OpenAI-compatible provider".format(provider))

    defaults = OPENAI_COMPATIBLE_PROVIDERS[provider]
    prefix = provider.upper()
    generic_model = _env_str("OPENAI_MODEL")
    generic_base = _env_str("OPENAI_API_BASE").rstrip("/")

    # Older .env.example files populated these OpenAI defaults. Do not let
    # those stale values override a named service's defaults.
    if provider != OPENAI:
        if generic_model == OPENAI_COMPATIBLE_PROVIDERS[OPENAI]["model"]:
            generic_model = ""
        if generic_base == OPENAI_COMPATIBLE_PROVIDERS[OPENAI]["api_base"]:
            generic_base = ""

    return {
        "api_key": _env_str("{}_API_KEY".format(prefix)),
        "model": _env_str("{}_MODEL".format(prefix), generic_model or defaults["model"]),
        "api_base": _env_str("{}_API_BASE".format(prefix), generic_base or defaults["api_base"]).rstrip("/"),
    }


# ---------------------------------------------------------------------------
# Sidebar defaults
# ---------------------------------------------------------------------------

DEFAULT_MODELS = {
    OLLAMA: OLLAMA_MODEL,
    GEMINI: GEMINI_MODEL,
    **{
        provider: get_openai_compatible_config(provider)["model"]
        for provider in OPENAI_COMPATIBLE_PROVIDERS
    },
}

PROVIDER_LABELS = {
    OLLAMA: "Ollama (local)",
    GEMINI: "Google Gemini API",
    **{
        provider: settings["label"]
        for provider, settings in OPENAI_COMPATIBLE_PROVIDERS.items()
    },
}

AVAILABLE_MODELS = {
    OLLAMA: ["qwen2.5:7b", "qwen2.5:14b", "llama3.1:8b", "mistral-nemo:12b"],
    GEMINI: [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
    ],
    **{
        provider: settings["models"]
        for provider, settings in OPENAI_COMPATIBLE_PROVIDERS.items()
    },
}

# Active-provider shorthands retained for backwards compatibility.
LLM_MODEL = DEFAULT_MODELS[LLM_PROVIDER]
API_ENDPOINT = OLLAMA_API_ENDPOINT


# ---------------------------------------------------------------------------
# Generation and app settings
# ---------------------------------------------------------------------------

TEMPERATURE = _env_float("LLM_TEMPERATURE", 0.3)
TOP_P = _env_float("LLM_TOP_P", 0.9)
REPEAT_PENALTY = _env_float("LLM_REPEAT_PENALTY", 1.1)  # Ollama only
NUM_CTX = _env_int("LLM_NUM_CTX", 2048)  # Ollama only
# 0 means "use the provider default" (no cap sent in the request).
MAX_OUTPUT_TOKENS = _env_int("LLM_MAX_OUTPUT_TOKENS", 0)
REQUEST_TIMEOUT = _env_int("LLM_REQUEST_TIMEOUT", 120)

APP_NAME = "GoodFoods AI Concierge"
APP_VERSION = "1.1.0"
DEBUG = _env_bool("DEBUG", False)

MAX_PARTY_SIZE = 20
MIN_ADVANCE_HOURS = 1
MAX_ADVANCE_DAYS = 90
DEFAULT_RESERVATION_DURATION_MINUTES = 90

DEFAULT_OPEN_TIME = "11:00"
DEFAULT_CLOSE_TIME = "22:00"

MAX_HISTORY_MESSAGES = 20
