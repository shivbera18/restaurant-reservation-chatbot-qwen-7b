# GoodFoods AI Reservation System

An end-to-end conversational AI agent for restaurant reservations, built from scratch with proper tool-calling architecture (MCP/A2A style).

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## Overview

GoodFoods AI Concierge is an intelligent virtual assistant that helps customers discover restaurants, get personalized recommendations, and manage reservations across 75 restaurant locations. The system runs on a **pluggable LLM backend** — a local model via Ollama, the Google Gemini API, or any OpenAI-compatible API — with a two-stage architecture: intent classification followed by intent-specific response generation with filtered tools.

### Key Features

- **Smart Search**: Find restaurants by cuisine, location, price, ambiance, and more
- **Personalized Recommendations**: AI-powered suggestions based on occasion and preferences
- **Instant Booking**: Create reservations through natural conversation
- **Reservation Management**: View, modify, or cancel existing bookings
- **Pluggable LLM Backends**: Ollama (local), Gemini, or any OpenAI-compatible API — switchable from the sidebar
- **Two-Stage Architecture**: Intent classification + focused response generation
- **Intent-Based Tool Filtering**: Reduces hallucination by exposing only relevant tools
- **Tool-Calling Architecture**: MCP-style function calling for reliable operations

## Project Structure

```
goodfoods_reservation/
├── app.py              # Streamlit frontend application
├── agent.py            # Main AI agent with two-stage tool-calling logic
├── llm_providers.py    # Pluggable LLM backends (Ollama / Gemini / OpenAI-compatible)
├── tools.py            # Tool definitions, executors, and intent-based filtering
├── database.py         # Restaurant data (75 locations) and booking storage
├── models.py           # Pydantic data models with enums
├── prompts.py          # Modular system prompts (base + intent-specific)
├── config.py           # Configuration settings (all env-overridable)
├── .env.example        # Template for API keys and model settings
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

## Quick Start

### Prerequisites

- Python 3.9 or higher
- **One** of: Ollama installed locally, a Gemini API key, or an OpenAI-compatible API key

### Installation

1. **Clone/Download the project**
   ```bash
   cd goodfoods_reservation
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Pick a backend** (copy `.env.example` to `.env` and edit it)

   <details open>
   <summary><b>Option A — Ollama (local, free, no API key)</b></summary>

   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull qwen2.5:7b
   ```
   ```ini
   # .env
   LLM_PROVIDER=ollama
   OLLAMA_MODEL=qwen2.5:7b
   ```
   </details>

   <details>
   <summary><b>Option B — Google Gemini API (free tier, no local GPU)</b></summary>

   Create a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
   ```ini
   # .env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your-key-here
   GEMINI_MODEL=gemini-2.5-flash
   ```
   </details>

   <details>
   <summary><b>Option C — OpenAI-compatible API (OpenAI, Groq, OpenRouter, LM Studio…)</b></summary>

   ```ini
   # .env — OpenAI
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your-key-here
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_API_BASE=https://api.openai.com/v1
   ```
   Point `OPENAI_API_BASE` elsewhere to use another vendor:

   | Vendor | `OPENAI_API_BASE` | Example `OPENAI_MODEL` |
   |--------|-------------------|------------------------|
   | OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
   | Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
   | OpenRouter | `https://openrouter.ai/api/v1` | `google/gemini-2.5-flash` |
   | LM Studio | `http://localhost:1234/v1` | *(whatever is loaded)* |
   </details>

5. **Run the application**
   ```bash
   streamlit run app.py
   ```

6. **Open in browser**
   Navigate to `http://localhost:8501`

### Switching Models

Three ways, in increasing order of convenience:

1. **Sidebar (no restart)** — pick a provider and model under **🧠 Model**. The
   status line tells you whether the backend is reachable and whether the key is
   set. Switching gives the assistant a fresh memory.
2. **`.env` file** — set `LLM_PROVIDER` plus that provider's model variable.
3. **Environment variable** — wins over `.env`:
   ```bash
   # macOS/Linux
   LLM_PROVIDER=gemini GEMINI_API_KEY=... streamlit run app.py
   ```
   ```powershell
   # Windows PowerShell
   $env:LLM_PROVIDER="gemini"; $env:GEMINI_API_KEY="..."; streamlit run app.py
   ```

`LLM_PROVIDER` also accepts aliases: `google` → gemini, and `groq` /
`openrouter` / `together` / `lmstudio` / `vllm` → openai. Unknown values fall
back to Ollama.

No key at all? Tick **Offline demo mode** in the sidebar to run the
pattern-matching agent with no LLM calls.

## Architecture

### Two-Stage Processing

The system uses a two-stage approach to reduce hallucination and improve response quality:

```
User Message → Stage 1: Intent Classification → Stage 2: Response Generation
                    ↓                                    ↓
              Minimal prompt                    Intent-specific prompt
              No tools                          Filtered tools only
                    ↓                                    ↓
              Intent(s): SEARCH, RESERVE, etc.  Focused response
```

**Stage 1 - Intent Classification:**
- Uses a minimal prompt to classify user intent
- Supports multi-intent detection (e.g., "recommend and book" → SEARCH, RESERVE)
- Categories: SEARCH, RESERVE, MANAGE, INFO, GENERAL

**Stage 2 - Response Generation:**
- Loads intent-specific prompt modules
- Exposes only tools relevant to the detected intent(s)
- Generates focused response with reduced hallucination

### Provider Abstraction

`agent.py` never talks HTTP. It calls one method and receives one canonical
shape, so the same two-stage tool loop runs unchanged on every backend:

```
ReservationAgent._call_llm(messages, tools)
        │
        ▼
LLMProvider.chat(messages, tools) ──► {"choices": [{"message": {...}}]}
        │
        ├── OllamaProvider              POST /api/chat
        ├── GeminiProvider              POST /v1beta/models/{model}:generateContent
        └── OpenAICompatibleProvider    POST /v1/chat/completions
```

Messages are always written in OpenAI form (`system` / `user` / `assistant` /
`tool`); each provider translates in both directions. Gemini needs the most
work, because its wire format differs in four ways:

| Concern | OpenAI / Ollama | Gemini |
|---------|-----------------|--------|
| System prompt | `{"role": "system"}` message | top-level `systemInstruction` |
| Turns | `messages`, role `assistant` | `contents`, role `model` |
| Tool call | `tool_calls[].function.arguments` (JSON **string**) | `parts[].functionCall.args` (**object**) |
| Tool result | `{"role": "tool", "tool_call_id": ...}` — matched by **id** | `parts[].functionResponse` — matched by **name** |

Two Gemini-specific traps are handled in `llm_providers.py`:

- **Schema subset.** Gemini's `functionDeclarations` accept only an OpenAPI
  subset, so `_to_gemini_schema()` uppercases type names and strips keys the API
  rejects (such as the `default` on `check_availability.party_size`).
- **Zero-argument tools.** Gemini rejects an `OBJECT` schema with no properties,
  so `get_neighborhoods` and `get_cuisine_types` omit `parameters` entirely
  rather than sending `{"properties": {}}`.

Adding a backend means subclassing `LLMProvider`, implementing `chat()`, and
registering it in `PROVIDER_REGISTRY` — no changes to the agent or tools.

### Intent-Based Tool Filtering

Each intent maps to specific tools:

| Intent | Tools |
|--------|-------|
| SEARCH | search_restaurants, get_recommendations, get_restaurant_details, get_neighborhoods, get_cuisine_types |
| RESERVE | check_availability, create_reservation, get_restaurant_details |
| MANAGE | lookup_reservation, modify_reservation, cancel_reservation |
| INFO | get_restaurant_details, get_neighborhoods, get_cuisine_types |
| GENERAL | get_neighborhoods, get_cuisine_types |

### Tool-Calling Design (MCP-Style)

```
User Message → LLM (with filtered tools) → Tool Calls → Executor → Results → LLM → Response
                    ↑                                                    │
                    └──────────────── Multi-turn loop ───────────────────┘
```

### Available Tools

| Tool | Description |
|------|-------------|
| `search_restaurants` | Search with filters (cuisine, price, location, etc.) |
| `get_recommendations` | Personalized suggestions based on preferences |
| `get_restaurant_details` | Full information about a specific restaurant |
| `check_availability` | View available time slots |
| `create_reservation` | Book a table |
| `lookup_reservation` | Find existing booking |
| `modify_reservation` | Update booking details |
| `cancel_reservation` | Cancel a booking |
| `get_neighborhoods` | List available areas |
| `get_cuisine_types` | List available cuisines |

### Data Model

```python
# 75 restaurants across 15 neighborhoods
# 15 cuisine types (lowercase: italian, mexican, japanese, etc.)
# 8 ambiance types (lowercase: casual, romantic, family_friendly, etc.)
# 4 price ranges: $, $$, $$$, $$$$
# Features: private dining, outdoor seating, bar, parking
# Dietary options: vegetarian, vegan, gluten-free
```

## Example Conversations

### 1. Restaurant Discovery

```
User: I'm looking for a romantic Italian restaurant in Downtown

Agent: I found some romantic Italian options in Downtown:

       1. **Bella Notte - Downtown** ($$$) - italian
          📍 Downtown | ⭐ 4.7/5 | 👥 Capacity: 120

       2. **Trattoria Roma - Downtown** ($$) - italian
          📍 Downtown | ⭐ 4.5/5 | 👥 Capacity: 85

       Would you like to make a reservation at any of these?
```

### 2. Making a Reservation

```
User: Book Bella Notte for 2 people this Saturday at 7pm.
      Name is John Smith, phone 555-123-4567

Agent: 📋 **Reservation Confirmed**
       ━━━━━━━━━━━━━━━━━━━━━━
       🎫 Confirmation: **GF8X2K9P**
       🍽️ Restaurant: Bella Notte - Downtown
       📅 Date: 2026-01-24
       ⏰ Time: 19:00
       👥 Party Size: 2
       👤 Name: John Smith
       📞 Phone: 555-123-4567
       ━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Multi-Intent Request

```
User: Recommend a place for my birthday and book it

Agent: [Detects intents: SEARCH, RESERVE]
       [Uses tools from both intents]

       Based on your birthday celebration, here are my recommendations:
       ...

       Would you like me to book one of these?
```

## Technical Specifications

### LLM Configuration

| Parameter | Value | Env var |
|-----------|-------|---------|
| Provider | `ollama` \| `gemini` \| `openai` | `LLM_PROVIDER` |
| Default local model | qwen2.5:7b | `OLLAMA_MODEL` |
| Default Gemini model | gemini-2.5-flash | `GEMINI_MODEL` |
| Default OpenAI model | gpt-4o-mini | `OPENAI_MODEL` |
| Temperature | 0.3 | `LLM_TEMPERATURE` |
| Top-p | 0.9 | `LLM_TOP_P` |
| Context window (Ollama) | 2048 | `LLM_NUM_CTX` |
| Max output tokens | provider default | `LLM_MAX_OUTPUT_TOKENS` |
| Request timeout | 120s | `LLM_REQUEST_TIMEOUT` |
| History limit | 20 messages | — |

All three backends support native tool calling, which the agent requires.

### Anti-Hallucination Measures

1. **Two-stage processing**: Separates intent detection from response generation
2. **Intent-based tool filtering**: Only relevant tools exposed per intent
3. **Lowercase enums**: Simplified values (e.g., `italian` not `Italian`) for reliable LLM output
4. **Explicit constraints**: System prompt rules like "ONLY pass parameters the user explicitly mentioned"
5. **Modular prompts**: Smaller, focused prompts per intent reduce cognitive load

## Testing

### Mock Mode

The system includes a `MockReservationAgent` for testing without any LLM backend
(also available as **Offline demo mode** in the sidebar):

```python
from agent import create_agent

# Create mock agent
agent = create_agent(use_mock=True)

# Test conversation
response = agent.chat("Find Italian restaurants")
print(response)
```

### Running Tests

```bash
# Test interactively
python -c "
from agent import create_agent
agent = create_agent(use_mock=True)
print(agent.chat('Hello'))
print(agent.chat('Find Japanese restaurants in Downtown'))
"
```

## Configuration

Defaults live in `config.py`; every value can be overridden by an environment
variable or a `.env` file (see `.env.example`). Real environment variables take
precedence over `.env`.

```python
LLM_PROVIDER = "ollama"          # ollama | gemini | openai

OLLAMA_MODEL = "qwen2.5:7b"      # OLLAMA_HOST defaults to localhost:11434
GEMINI_MODEL = "gemini-2.5-flash"  # needs GEMINI_API_KEY
OPENAI_MODEL = "gpt-4o-mini"       # needs OPENAI_API_KEY + OPENAI_API_BASE

TEMPERATURE = 0.3
TOP_P = 0.9
MAX_OUTPUT_TOKENS = 0            # 0 = use the provider's own default
REQUEST_TIMEOUT = 120

DEBUG = True                     # Set to False to hide debug output
MAX_HISTORY_MESSAGES = 20        # Conversation history limit
```

Selecting a backend in code:

```python
from agent import create_agent

agent = create_agent()                                        # uses LLM_PROVIDER
agent = create_agent(provider="gemini")                       # default Gemini model
agent = create_agent(provider="gemini", model="gemini-2.0-flash")
agent = create_agent(provider="ollama", model="llama3.1:8b")
agent = create_agent(use_mock=True)                           # no LLM at all
```

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Could not reach Ollama at http://localhost:11434` | Start it with `ollama serve` |
| `Model 'x' is not pulled` | `ollama pull x` |
| `GEMINI_API_KEY is not set` | Add it to `.env`, then restart Streamlit |
| `Gemini API error 400: API key not valid` | Key is wrong or lacks Generative Language API access |
| `Gemini API error 404` | Model name not available to your key — try `gemini-2.0-flash` |
| Sidebar shows a stale status | Click **Recheck connection** |

Set `DEBUG=true` to print every request and raw response to the terminal.

## Future Enhancements

- [ ] Voice interface integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Waitlist management
- [ ] Push notifications
- [ ] Streaming responses

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- Built with [Streamlit](https://streamlit.io)
- Runs on [Ollama](https://ollama.ai), the [Gemini API](https://ai.google.dev), or any OpenAI-compatible endpoint
- Inspired by [Model Context Protocol](https://modelcontextprotocol.io)

---

**Created for the AI Agent Challenge** | Restaurant Reservation System | January 2026
