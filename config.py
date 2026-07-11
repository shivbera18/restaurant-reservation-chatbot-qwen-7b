import os

LLM_PROVIDER = "ollama"
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:7b")

API_ENDPOINT = "http://localhost:11434/api/chat"

AVAILABLE_MODELS = {
    "default": "qwen2.5:7b",
    "small": "llama3.1:8b"
}

APP_NAME = "GoodFoods AI Concierge"
APP_VERSION = "1.0.0"
DEBUG = True

MAX_PARTY_SIZE = 20
MIN_ADVANCE_HOURS = 1
MAX_ADVANCE_DAYS = 90
DEFAULT_RESERVATION_DURATION_MINUTES = 90

DEFAULT_OPEN_TIME = "11:00"
DEFAULT_CLOSE_TIME = "22:00"

MAX_HISTORY_MESSAGES = 20
