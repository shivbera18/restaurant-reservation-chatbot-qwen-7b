"""Offline smoke tests for provider translation and configuration."""
import json
import os
import unittest
from unittest.mock import patch

from agent import Message, ReservationAgent
from config import normalize_provider
from llm_providers import (
    GeminiProvider,
    OpenAICompatibleProvider,
    _is_local_endpoint,
    create_provider,
)


class ProviderSmokeTests(unittest.TestCase):
    def test_named_openai_compatible_provider_uses_its_own_endpoint(self):
        with patch.dict(
            os.environ,
            {
                "GROQ_API_KEY": "test-key",
                "OPENAI_MODEL": "gpt-4o-mini",
                "OPENAI_API_BASE": "https://api.openai.com/v1",
            },
            clear=True,
        ):
            provider = create_provider("groq")
        self.assertEqual(provider.name, "groq")
        self.assertEqual(provider.api_key, "test-key")
        self.assertEqual(provider.model, "llama-3.3-70b-versatile")
        self.assertEqual(
            provider.endpoint, "https://api.groq.com/openai/v1/chat/completions"
        )

    def test_named_provider_never_reuses_another_provider_key(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "openai-key"}, clear=True):
            provider = create_provider("groq")
        self.assertEqual(provider.api_key, "")
        self.assertEqual(provider.is_configured(), (False, "GROQ_API_KEY is not set"))

    def test_only_loopback_endpoints_can_omit_a_key(self):
        self.assertTrue(_is_local_endpoint("http://localhost:1234/v1"))
        self.assertTrue(_is_local_endpoint("http://127.0.0.1:8000/v1"))
        self.assertTrue(_is_local_endpoint("http://[::1]:8000/v1"))
        remote = OpenAICompatibleProvider(
            api_key="", api_base="https://example.com/localhost/v1"
        )
        self.assertFalse(_is_local_endpoint("https://example.com/localhost/v1"))
        self.assertEqual(remote.is_configured(), (False, "OPENAI_API_KEY is not set"))

    def test_unknown_provider_fails_fast(self):
        with self.assertRaises(ValueError):
            normalize_provider("not-a-provider")

    def test_tool_result_stays_structured_for_gemini(self):
        agent = ReservationAgent(provider="lmstudio")
        result = {"success": True, "data": {"restaurant_id": "REST001"}, "error": None}
        agent.conversation.messages.extend(
            [
                Message(role="user", content="Find a restaurant"),
                Message(
                    role="assistant",
                    content="",
                    tool_calls=[
                        {
                            "id": "call_1",
                            "type": "function",
                            "function": {"name": "search_restaurants", "arguments": {}},
                        }
                    ],
                ),
                Message(
                    role="tool",
                    content=json.dumps(result),
                    tool_call_id="call_1",
                    name="search_restaurants",
                ),
            ]
        )

        contents, _ = GeminiProvider(api_key="test")._build_contents(
            agent._format_messages_for_api()
        )
        response = contents[-1]["parts"][0]["functionResponse"]["response"]
        self.assertEqual(response, result)

    def test_gemini_preserves_thought_signature(self):
        provider = GeminiProvider(api_key="test")
        raw_gemini_response = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "functionCall": {
                                    "name": "get_recommendations",
                                    "args": {"cuisine": "italian"},
                                    "thought_signature": "sig_abc123",
                                }
                            }
                        ]
                    },
                    "finishReason": "STOP",
                }
            ]
        }
        normalized = provider._normalize(raw_gemini_response)
        assistant_msg = normalized["choices"][0]["message"]
        self.assertEqual(
            assistant_msg["tool_calls"][0]["function"]["thought_signature"],
            "sig_abc123",
        )

        # Verify history reconstruction includes thought_signature in functionCall
        messages = [
            {"role": "user", "content": "Recommend a place"},
            assistant_msg,
            {
                "role": "tool",
                "name": "get_recommendations",
                "content": '{"result": "ok"}',
            },
        ]
        contents, _ = provider._build_contents(messages)
        model_turn = contents[1]
        fc = model_turn["parts"][0]["functionCall"]
        self.assertEqual(fc["name"], "get_recommendations")
        self.assertEqual(fc["thought_signature"], "sig_abc123")

if __name__ == "__main__":
    unittest.main(verbosity=2)
