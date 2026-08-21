# GoodFoods AI Concierge — Comprehensive Improvement Plan & Architecture Roadmap

> **Audit Status**: Updated following Neon PostgreSQL migration, Auth + User Ownership integration, and Frontend Neobrutalist modernization.
> **Notation**: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low severity/impact.  
> **Effort**: S (< 1 hr), M (1–4 hrs), L (4–16 hrs), XL (multi-day).

---

## 1. Status of Audit Items: Completed vs Remaining

### 1a. Completed Improvements (Verified in Code & Merged to Main)
- [x] **B1**: Intent classifier passes last 3 conversation turns (`agent.py`).
- [x] **B2**: Strict date/time/capacity validation in `create_reservation` (`database.py`).
- [x] **B3**: Availability aggregates `party_size` per time slot rather than overwriting (`database.py`).
- [x] **B4**: Deterministic restaurant seeding with `random.seed(42)` (`database.py`).
- [x] **B5**: Removed undefined `get_faq` tool from intent mappings (`tools.py`).
- [x] **B7 & B10**: Removed Streamlit and aiohttp dependencies, updated architecture to FastAPI + Vite/React (`requirements.txt`, `README.md`).
- [x] **B8 & B9**: Cleared hardcoded personal PII and invalid Tailwind utility classes from UI components (`ChatArea.tsx`, `QuickBookingBar.tsx`).
- [x] **S2**: Full Customer Authentication system with scrypt hashing, 32-byte session tokens, and strict user ownership checks on reservations (`neon_db.py`, `server.py`).
- [x] **S4 & S5**: Chat message input capped at 2,000 chars, CORS restricted to local origins (`server.py`).
- [x] **T1 & T4**: Phone number digit validation added; 409 Conflict returned when attempting to cancel an already cancelled reservation (`database.py`, `server.py`).
- [x] **A7**: Rejection of empty/whitespace-only messages with 422 before LLM execution (`server.py`).
- [x] **D1**: Neon Cloud PostgreSQL persistent relational layer for users, sessions, restaurants, reservations, and chat messages (`neon_db.py`).
- [x] **F3 & F7**: Switched to `crypto.randomUUID()` for unique chat keys; uninstalled dead dependencies `clsx` and `tailwind-merge`.
- [x] **F10**: Dynamic restaurant counts sourced directly from system stats (`config.stats.restaurants_count`).
- [x] **U2, U3, U4**: Modal overlays close on Escape key and backdrop clicks with `role="dialog"` accessibility tags (`ModelPickerModal.tsx`, `RestaurantExplorerModal.tsx`, `ReservationsDrawer.tsx`).
- [x] **U10**: Replaced native browser `alert()` popups with styled Neobrutalist toast notifications (`App.tsx`).
- [x] **U13**: Inline reservation modification UI and backend endpoint (`POST /api/reservations/modify`).

---

### 1b. Remaining High-Priority Improvements
| # | Category | Finding | Impact | Effort | Planned Fix |
|---|---|---|---|---|---|
| **S3** | Security | **No rate limiting on `/api/chat`** | 🟠 High | S | Implement `slowapi` or in-memory token bucket (20 req/min per IP/session). |
| **S6** | Security | **Destructive tool confirmation guardrail** | 🟠 High | M | Enforce explicit user confirmation before executing modify/cancel actions. |
| **P1** | Provider | **No retry logic with exponential backoff** | 🟠 High | M | Wrap LLM calls in tenacity/backoff for transient 429/500/503 errors. |
| **P2** | Provider | **No SSE / streaming response support** | 🟠 High | L | Stream assistant message tokens over Server-Sent Events (`/api/chat/stream`). |
| **P3** | Provider | **No HTTP connection pooling** | 🟡 Med | S | Use a persistent `requests.Session` or `httpx.AsyncClient` inside `llm_providers.py`. |
| **A1** | Agent | **Double LLM call latency** | 🟡 Med | M | Skip Stage 1 intent classification when prior turn is mid-booking or explicit. |
| **A4** | Agent | **No structured slot-filling state machine** | 🟠 High | M | Track structured booking state (cuisine, date, time, party size, guest details) to avoid redundant questions. |
| **T3** | Tools | **Availability ignores reservation duration** | 🟡 Med | M | Block overlapping slots across table occupancy duration (default 90 mins). |
| **T5** | Tools | **Missing Menu & Dietary Query Tools** | 🟡 Med | M | Implement `get_restaurant_menu` and structured allergen query tools. |
| **F1 & F2**| Frontend | **Missing request abort & timeout** | 🟠 High | S | Wire `AbortController` and 30s timeout into `sendChatMessage`. |
| **U1** | A11y | **Missing focus traps on modal dialogs** | 🟡 Med | S | Restrict tab navigation inside open modal overlays. |
| **R4** | Perf | **Unvirtualized 75-card restaurant explorer** | 🟡 Med | M | Implement virtualized rendering or paginated grid in `RestaurantExplorerModal`. |

---

## 2. Advanced Architectural Additions

### 2a. Internal Tool Architecture: "Team" (Restaurant Partner & Staff Operations Suite)

The **Team** tool transforms the platform from a consumer-only chatbot into a complete two-sided hospitality operations engine.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      GOODFOODS ECOSYSTEM ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────────────┘
        │                                                    │
        ▼ (Consumer Channel)                                 ▼ (Partner Channel)
┌───────────────────────────────┐            ┌────────────────────────────┐
│      AI Dining Concierge      │            │       Team Ops Engine      │
│  (Chatbot, Search, Booking)   │            │  (Host Stand, Shifts, CRM) │
└───────────────────────────────┘            └────────────────────────────┘
        │                                                    │
        └──────────────────────┬─────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          CORE BACKEND & DB LAYER                        │
│   FastAPI Endpoints · Multi-Agent Orchestration · Neon PostgreSQL DB   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Core Capabilities of the `Team` Suite:
1. **Multi-Tenant Staff & Role-Based Access Control (RBAC)**:
   - `team_members` table linking authenticated users to specific `restaurant_id` venues.
   - Roles: `owner`, `general_manager`, `host`, `server`.
2. **Live Host Stand & Floor Management (`/team/floorplan`)**:
   - Real-time visual table map with status badges (`Available`, `Seated`, `Reserved`, `Cleaning`).
   - Drag-and-drop party assignment and reservation check-in/seated lifecycle tracking.
3. **Dynamic Capacity & Table Override Engine (`/team/capacity`)**:
   - Ability for restaurant managers to blackout dates, hold VIP tables, or adjust capacity on the fly.
   - Instant reflection in the consumer AI Agent's `check_availability` tool.
4. **Autonomous Operational Agent Tools for Restaurant Staff**:
   - `get_daily_manifest(date, restaurant_id)`: Summarizes upcoming covers, VIP guests, and dietary restrictions.
   - `send_guest_broadcast(reservation_id, message)`: Direct SMS/WhatsApp operational updates to guests.
   - `adjust_shift_capacity(restaurant_id, time_slot, delta)`: Emergency surge or reduction of online tables.

---

### 2b. Next-Level AI Concierge Enhancements

1. **Multi-Agent Specialist Swarm**:
   - **Concierge Agent**: Natural conversation and vibe curation.
   - **Booking Agent**: High-precision slot validation and atomic database writes.
   - **Sommelier & Menu Agent**: Deep menu knowledge and food-wine pairings.
2. **Multi-Channel Interfaces**:
   - **Voice Agent**: Web Speech API for voice-driven bookings.
   - **WhatsApp / SMS Gateway**: Twilio webhook integration for conversational booking on mobile messengers.
3. **Smart Conflict & Alternative Resolver**:
   - If 19:30 is fully booked, proactively check and propose 19:00 or 20:00 at the same venue, or equivalent sister venues within 1 mile.
4. **Guest Profile & VIP Memory**:
   - Persistent guest preferences (e.g., "Corner booth preferred", "Severe peanut allergy", "Anniversary on Aug 22") automatically passed to future reservations.

---

## 3. Implementation Roadmap

### Phase 1: Hardening & Intelligence (Sprint 1)
- [ ] Rate limiting on chat endpoints with `slowapi` (**S3**).
- [ ] Structured slot-filling state machine in `ConversationState` (**A4**).
- [ ] Streaming response SSE implementation on `/api/chat/stream` (**P2**).
- [ ] Reservation duration occupancy overlap protection in `database.py` (**T3**).

### Phase 2: "Team" Partner Foundation (Sprint 2)
- [ ] Database schema extension: `team_members`, `tables`, `table_assignments` in `neon_db.py`.
- [ ] Backend API routes for staff authentication and live daily manifests under `/api/team/*`.
- [ ] Staff agent tools: `get_daily_manifest`, `update_reservation_status` (Seated / Completed / No-Show).

### Phase 3: "Team" UI & Floor Stand (Sprint 3)
- [ ] Neobrutalist Host Stand dashboard route `/team` with live table status and filterable cover sheet.
- [ ] Instant capacity override controls linked directly to agent availability queries.
- [ ] Real-time synchronization via WebSockets for live status updates across staff tablets.
