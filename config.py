"""
Application and LLM configuration.

Every setting below can be overridden with an environment variable, either
exported in the shell or placed in a `.env` file next to this module
(see `.env.example`).

The agent supports three interchangeable backends:

    ollama  - local models served by Ollama (default, e.g. qwen2.5:7b)
    gemini  - Google Gemini API (needs GEMINI_API_KEY)
    openai  - any OpenAI-compatible /chat/completions endpoint
              (OpenAI, Groq, OpenRouter, Together, LM Studio, vLLM, ...)

Switch backends with LLM_PROVIDER, or from the Streamlit sidebar at runtime.
"""
import os

try:
    from dotenv import load_dotenv

    # Anchored to this file so the .env is found no matter where the app is
    # launched from (e.g. `streamlit run /full/path/to/app.py`).
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
except ImportError:  # python-dotenv is optional; plain env vars still work
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
    if not raw:
        return default
    return raw in ("1", "true", "yes", "on")


# ---------------------------------------------------------------------------
# Active provider
# ---------------------------------------------------------------------------

OLLAMA = "ollama"
GEMINI = "gemini"
OPENAI = "openai"

SUPPORTED_PROVIDERS = (OLLAMA, GEMINI, OPENAI)

# Aliases so LLM_PROVIDER=google / groq / openrouter also work.
PROVIDER_ALIASES = {
    "google": GEMINI,
    "google-gemini": GEMINI,
    "googleai": GEMINI,
    "gemini-api": GEMINI,
    "openai-compatible": OPENAI,
    "openai_compatible": OPENAI,
    "groq": OPENAI,
    "openrouter": OPENAI,
    "together": OPENAI,
    "lmstudio": OPENAI,
    "vllm": OPENAI,
    "local": OLLAMA,
    "qwen": OLLAMA,
}


def normalize_provider(name: str) -> str:
    """Map a user-supplied provider name onto one of SUPPORTED_PROVIDERS."""
    key = (name or "").strip().lower()
    key = PROVIDER_ALIASES.get(key, key)
    return key if key in SUPPORTED_PROVIDERS else OLLAMA


LLM_PROVIDER = normalize_provider(_env_str("LLM_PROVIDER", OLLAMA))


# ---------------------------------------------------------------------------
# Ollama (local models)
# ---------------------------------------------------------------------------

OLLAMA_HOST = _env_str("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
OLLAMA_API_ENDPOINT = _env_str("OLLAMA_API_ENDPOINT", OLLAMA_HOST + "/api/chat")
# LLM_MODEL is honoured for backwards compatibility with the original config.
OLLAMA_MODEL = _env_str("OLLAMA_MODEL", _env_str("LLM_MODEL", "qwen2.5:7b"))
OLLAMA_KEEP_ALIVE = _env_str("OLLAMA_KEEP_ALIVE", "10m")


# ---------------------------------------------------------------------------
# Google Gemini
# ---------------------------------------------------------------------------

# Get a free key at https://aistudio.google.com/apikey
GEMINI_API_KEY = _env_str("GEMINI_API_KEY", _env_str("GOOGLE_API_KEY"))
GEMINI_MODEL = _env_str("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_BASE = _env_str(
    "GEMINI_API_BASE", "https://generativelanguage.googleapis.com/v1beta"
).rstrip("/")


# ---------------------------------------------------------------------------
# OpenAI-compatible endpoints (OpenAI, Groq, OpenRouter, LM Studio, vLLM, ...)
# ---------------------------------------------------------------------------

OPENAI_API_KEY = _env_str("OPENAI_API_KEY")
OPENAI_MODEL = _env_str("OPENAI_MODEL", "gpt-4o-mini")
# Accepts either a bare base URL ("https://api.groq.com/openai/v1") or a full
# chat-completions URL; the provider normalizes it.
OPENAI_API_BASE = _env_str("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")


# ---------------------------------------------------------------------------
# Per-provider defaults used by the factory and the Streamlit sidebar
# ---------------------------------------------------------------------------

DEFAULT_MODELS = {
    OLLAMA: OLLAMA_MODEL,
    GEMINI: GEMINI_MODEL,
    OPENAI: OPENAI_MODEL,
}

PROVIDER_LABELS = {
    OLLAMA: "Ollama (local)",
    GEMINI: "Google Gemini API",
    OPENAI: "OpenAI-compatible API",
}

# Suggestions for the model dropdown. Any model id can still be typed manually;
# these are only shortcuts. All listed models support tool/function calling.
AVAILABLE_MODELS = {
    OLLAMA: [
        "qwen2.5:7b",
        "qwen2.5:14b",
        "llama3.1:8b",
        "mistral-nemo:12b",
    ],
    GEMINI: [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
    ],
    OPENAI: [
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-4.1-mini",
        "llama-3.3-70b-versatile",
    ],
}

# Active-provider shorthands (kept for backwards compatibility).
LLM_MODEL = DEFAULT_MODELS[LLM_PROVIDER]
API_ENDPOINT = OLLAMA_API_ENDPOINT


# ---------------------------------------------------------------------------
# Generation parameters (shared across providers where supported)
# ---------------------------------------------------------------------------

TEMPERATURE = _env_float("LLM_TEMPERATURE", 0.3)
TOP_P = _env_float("LLM_TOP_P", 0.9)
REPEAT_PENALTY = _env_float("LLM_REPEAT_PENALTY", 1.1)  # Ollama only
NUM_CTX = _env_int("LLM_NUM_CTX", 2048)  # Ollama only
# 0 means "use the provider default" (no cap sent in the request).
MAX_OUTPUT_TOKENS = _env_int("LLM_MAX_OUTPUT_TOKENS", 0)
REQUEST_TIMEOUT = _env_int("LLM_REQUEST_TIMEOUT", 120)


# ---------------------------------------------------------------------------
# App settings
# ---------------------------------------------------------------------------

APP_NAME = "GoodFoods AI Concierge"
APP_VERSION = "1.1.0"
DEBUG = _env_bool("DEBUG", True)

MAX_PARTY_SIZE = 20
MIN_ADVANCE_HOURS = 1
MAX_ADVANCE_DAYS = 90
DEFAULT_RESERVATION_DURATION_MINUTES = 90

DEFAULT_OPEN_TIME = "11:00"
DEFAULT_CLOSE_TIME = "22:00"

MAX_HISTORY_MESSAGES = 20
