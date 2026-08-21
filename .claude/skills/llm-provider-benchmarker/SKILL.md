---
name: llm-provider-benchmarker
description: >
  Benchmarks and verifies LLM provider backends (Groq, Google Gemini, Ollama,
  OpenAI, OpenRouter, DeepSeek, Together, Fireworks, LM Studio, vLLM). Verifies
  API endpoint reachability, model deprecations, function-calling formats,
  rate limits, and latency.
argument-hint: "[provider_name]"
license: MIT
---

# LLM Provider Benchmarker

Diagnoses and verifies backend connectivity across all registered providers in `config.py` and `llm_providers.py`.

## Supported Backends Matrix

| Provider | Protocol | Default Model | Key Variable |
|---|---|---|---|
| `groq` | OpenAI-compatible | `openai/gpt-oss-120b` | `GROQ_API_KEY` |
| `gemini` | REST generateContent | `gemini-3.6-flash` | `GEMINI_API_KEY` |
| `ollama` | Ollama `/api/chat` | `qwen2.5:7b` | (None, local `OLLAMA_HOST`) |
| `openai` | OpenAI `/v1/chat/completions` | `gpt-4o-mini` | `OPENAI_API_KEY` |
| `openrouter` | OpenAI-compatible | `openai/gpt-4o-mini` | `OPENROUTER_API_KEY` |
| `deepseek` | OpenAI-compatible | `deepseek-chat` | `DEEPSEEK_API_KEY` |

## Diagnostic Workflow

1. **Verify Environment Variables**:
   - Check presence of provider API key in `.env`.
2. **Ping Provider Endpoint**:
   - Run health probe via `provider.is_configured()`.
3. **Verify Tool Declaration Serialization**:
   - OpenAI compatible: `tools: [{"type": "function", "function": {...}}]`
   - Gemini: `tools: [{"functionDeclarations": [...]}]`
4. **Test Function Call Normalization**:
   - Ensure arguments JSON string parses to dictionary.
   - Verify tool call IDs match responses.

## Quick CLI Probe

```bash
python -c "
from llm_providers import create_provider
from config import SUPPORTED_PROVIDERS

for p in ['groq', 'gemini', 'ollama']:
    try:
        prov = create_provider(p)
        ready, reason = prov.is_configured()
        print(f'[{p.upper()}] Model: {prov.model} -> Ready: {ready} ({reason})')
    except Exception as e:
        print(f'[{p.upper()}] Error: {e}')
"
```
