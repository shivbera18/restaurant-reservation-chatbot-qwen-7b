---
name: reservation-flow-validator
description: >
  Validates end-to-end multi-turn reservation flows (intent classification,
  tool-calling, availability checks, booking creation, lookup, modification,
  and cancellation) across pluggable LLM backends and Mock mode. Use when
  testing agent logic, verifying tool filtering, debugging conversation state,
  or testing intent transitions.
argument-hint: "[groq|gemini|ollama|openai|mock]"
license: MIT
---

# Reservation Flow Validator

Validates the two-stage GoodFoods conversational agent pipeline:
1. **Stage 1 (Intent Classification)**: Verifies user message is correctly tagged (`SEARCH`, `RESERVE`, `MANAGE`, `INFO`, `GENERAL`).
2. **Stage 2 (Response Generation & Tool Execution)**: Verifies tool filtering, function execution, and state persistence.

## When to Run

- After modifying `agent.py`, `tools.py`, `prompts.py`, or `models.py`.
- When testing a new LLM provider or model.
- When tool validation errors (`400`, missing parameters) occur.

## Validation Scenarios

### 1. Discovery Flow (`SEARCH`)
- **Prompt**: `"Find me a romantic Italian restaurant in Downtown with outdoor seating."`
- **Expected Tools**: `search_restaurants`, `get_recommendations`, `get_restaurant_details`.
- **Invariants**:
  - `agent.conversation.selected_restaurant` is updated if 1 match is focused.
  - No booking is created prematurely.

### 2. Full Booking Flow (`RESERVE`)
- **Prompt**: `"Book a table for 4 at Thai Orchid Downtown on 2026-08-22 at 21:00. Name: Shiv, Phone: 990-643-3115."`
- **Expected Tools**: `check_availability`, `create_reservation`.
- **Invariants**:
  - `db.reservations` receives a new entry with status `CONFIRMED`.
  - Confirmation code matches `^GF[A-Z0-9]{6}$`.
  - `active_reservations` in API response contains the new booking.

### 3. Management Flow (`MANAGE`)
- **Prompt**: `"Cancel my reservation with confirmation code <CODE>."`
- **Expected Tools**: `lookup_reservation`, `cancel_reservation`.
- **Invariants**:
  - `db.reservations[<ID>].status` becomes `CANCELLED`.

## Automated Smoke Check

```bash
python -c "
from agent import create_agent
from database import db

agent = create_agent(use_mock=True)
res = agent.chat('Book a table for 4 at Bella Notte Downtown on 2026-08-22 at 19:00. Name: Test, Phone: 555-0199.')
assert len(db.reservations) > 0, 'Reservation creation failed'
print('Reservation flow validation PASSED')
"
```
