# GoodFoods AI Reservation System

An end-to-end conversational AI agent for restaurant reservations, built from scratch with proper tool-calling architecture (MCP/A2A style).

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## Demo

[![GoodFoods AI Demo](https://img.youtube.com/vi/VXciDUX4-ys/0.jpg)](https://youtu.be/VXciDUX4-ys)

Watch the demo video to see the AI concierge in action.

## Overview

GoodFoods AI Concierge is an intelligent virtual assistant that helps customers discover restaurants, get personalized recommendations, and manage reservations across 75 restaurant locations. The system uses a local LLM (via Ollama) with a two-stage architecture: intent classification followed by intent-specific response generation with filtered tools.

### Key Features

- **Smart Search**: Find restaurants by cuisine, location, price, ambiance, and more
- **Personalized Recommendations**: AI-powered suggestions based on occasion and preferences
- **Instant Booking**: Create reservations through natural conversation
- **Reservation Management**: View, modify, or cancel existing bookings
- **Two-Stage Architecture**: Intent classification + focused response generation
- **Intent-Based Tool Filtering**: Reduces hallucination by exposing only relevant tools
- **Tool-Calling Architecture**: MCP-style function calling for reliable operations

## Project Structure

```
goodfoods_reservation/
├── app.py              # Streamlit frontend application
├── agent.py            # Main AI agent with two-stage tool-calling logic
├── tools.py            # Tool definitions, executors, and intent-based filtering
├── database.py         # Restaurant data (75 locations) and booking storage
├── models.py           # Pydantic data models with enums
├── prompts.py          # Modular system prompts (base + intent-specific)
├── config.py           # Configuration settings (Ollama)
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

## Quick Start

### Prerequisites

- Python 3.9 or higher
- Ollama installed and running locally

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

4. **Install and run Ollama**
   ```bash
   # Install Ollama from https://ollama.ai
   # Pull the default model
   ollama pull qwen2.5:7b

   # Or use an alternative model
   ollama pull llama3.1:8b
   ```

5. **Run the application**
   ```bash
   streamlit run app.py
   ```

6. **Open in browser**
   Navigate to `http://localhost:8501`

### Changing the Model

Set the `LLM_MODEL` environment variable:
```bash
export LLM_MODEL="llama3.1:8b"  # or any Ollama model
streamlit run app.py
```

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

| Parameter | Value |
|-----------|-------|
| Provider | Ollama (local) |
| Default Model | qwen2.5:7b |
| Alternative | llama3.1:8b |
| Temperature | 0.4 |
| Endpoint | http://localhost:11434/api/chat |

### Anti-Hallucination Measures

1. **Two-stage processing**: Separates intent detection from response generation
2. **Intent-based tool filtering**: Only relevant tools exposed per intent
3. **Lowercase enums**: Simplified values (e.g., `italian` not `Italian`) for reliable LLM output
4. **Explicit constraints**: System prompt rules like "ONLY pass parameters the user explicitly mentioned"
5. **Modular prompts**: Smaller, focused prompts per intent reduce cognitive load

## Testing

### Mock Mode

The system includes a `MockReservationAgent` for testing without Ollama:

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

All configuration is in `config.py`:

```python
LLM_PROVIDER = "ollama"
LLM_MODEL = "qwen2.5:7b"  # or set via LLM_MODEL env var
API_ENDPOINT = "http://localhost:11434/api/chat"

DEBUG = True  # Set to False to hide debug output
MAX_HISTORY_MESSAGES = 20  # Conversation history limit
```

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
- Powered by [Ollama](https://ollama.ai)
- Inspired by [Model Context Protocol](https://modelcontextprotocol.io)

---

**Created for the AI Agent Challenge** | Restaurant Reservation System | January 2026
