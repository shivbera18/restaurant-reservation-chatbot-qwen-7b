# GoodFoods AI Concierge — Comprehensive Improvement Plan

> Generated from a full-codebase audit of every Python and TypeScript file,
> covering architecture, agent logic, tooling, database, providers, frontend,
> UX, security, performance, and product strategy.
>
> **Notation**: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low — severity or impact.
> Effort: S (< 1 hr), M (1–4 hrs), L (4–16 hrs), XL (multi-day).

---

## Table of Contents

1. [Bugs — Actually Broken Right Now](#1-bugs--actually-broken-right-now)
2. [Security & Safety](#2-security--safety)
3. [Backend Architecture & Agent Intelligence](#3-backend-architecture--agent-intelligence)
4. [Database & Data Layer](#4-database--data-layer)
5. [LLM Provider Layer](#5-llm-provider-layer)
6. [Server / API Layer](#6-server--api-layer)
7. [Frontend Architecture & Code Quality](#7-frontend-architecture--code-quality)
8. [UI / UX & Accessibility](#8-ui--ux--accessibility)
9. [Performance](#9-performance)
10. [Testing](#10-testing)
11. [Documentation & Demo-ability](#11-documentation--demo-ability)
12. [Transformative Feature Ideas](#12-transformative-feature-ideas)
13. [Prioritized Roadmap](#13-prioritized-roadmap)

---

## 1. Bugs — Actually Broken Right Now

| # | Bug | File(s) | Severity | Effort | Fix |
|---|-----|---------|----------|--------|-----|
| B1 | **Intent classifier ignores conversation history** — `_classify_intent()` sends only `[system, user_message]` with zero prior turns. Follow-ups like "yes, book it" after a search classify as GENERAL, not RESERVE, because the classifier has no context. | `agent.py:159-191` | 🔴 | S | Include last 2–3 conversation turns in the classification call. |
| B2 | **No date/time validation on `create_reservation`** — accepts past dates ("2020-01-01"), invalid times ("99:99"), and impossible party sizes (0, -1, 1000). `MAX_PARTY_SIZE`, `MAX_ADVANCE_DAYS`, `MIN_ADVANCE_HOURS` exist in config but are **never enforced**. | `tools.py:594-603`, `database.py:409-449` | 🔴 | S | Validate format, range, and bounds before creating. |
| B3 | **Availability double-booking** — `reserved_times` is a plain dict (`{time: party_size}`). Multiple reservations at the same time slot overwrite each other; only the last one's party_size is subtracted from capacity. | `database.py:377` | 🔴 | S | Use `defaultdict(int)` and `+=` to accumulate party sizes. |
| B4 | **Non-deterministic restaurant data** — no `random.seed()`, so ratings, capacities, and features change every server restart. A restaurant rated 4.8 on one run may be 3.9 on the next. Breaks testing and consistent UX. | `database.py:188-196` | 🟠 | S | Add `random.seed(42)` at the top of `_seed_restaurants()`. |
| B5 | **`get_faq` referenced in `INTENT_TOOLS` but never defined** — no tool definition in `TOOL_DEFINITIONS` and no handler in `ToolExecutor`. If the LLM ever calls it: "Unknown tool" error. | `tools.py:814-815` | 🟡 | S | Implement the FAQ tool or remove from `INTENT_TOOLS`. |
| B6 | **`collected_preferences` and `pending_reservation` are dead state** — defined in `ConversationState` but never read or written. | `agent.py:21-28` | 🟡 | S | Remove or implement. |
| B7 | **README references Streamlit** throughout, but the app now uses FastAPI + React. Quick Start instructions are wrong. Frontend setup instructions are completely missing. | `README.md` | 🔴 | S | Rewrite Quick Start for the actual architecture. |
| B8 | **Hardcoded PII in QuickBookingBar** — `name='Shiv'`, `phone='990-643-3115'`, `date='2026-08-22'` shipped as default form values. | `QuickBookingBar.tsx:28-30` | 🟠 | S | Set to empty strings; use `new Date().toISOString().slice(0,10)` for date. |
| B9 | **`py-0.2` is not a valid Tailwind class** — appears in `Header.tsx:73,87`, `RestaurantCard.tsx:50,104`. Silently generates nothing; no vertical padding applied. | Multiple `.tsx` files | 🟠 | S | Replace with `py-px` or `py-0.5`, or extend spacing scale. |
| B10 | **`requirements.txt` lists unused deps** — `streamlit>=1.28.0` (app uses FastAPI), `aiohttp>=3.9.0` (never imported), `black`/`pytest` (dev deps mixed with runtime). | `requirements.txt` | 🟡 | S | Clean up; split dev deps into `requirements-dev.txt`. |
| B11 | **Dual data-fetching for reservations** — `ReservationsDrawer` fetches independently AND receives `initialReservations` prop. `useEffect([initialReservations])` can overwrite a fresh fetch, causing race conditions. | `ReservationsDrawer.tsx:42-48` | 🟠 | S | Pick one source of truth: either self-sufficient or parent-driven. |
| B12 | **Cancel from drawer bypasses agent memory** — clicking Cancel calls API directly, then injects a synthetic assistant message. The agent's conversation history doesn't know it happened. | `App.tsx:handleCancelBooking` | 🟡 | S | Route through agent chat instead of direct API call. |
| B13 | **QuickBookingBar chips send context-free fragments** — messages like "Party size will be 4 people." classify as GENERAL because there's no prior context. | `QuickBookingBar.tsx` | 🟡 | S | Rewrite as conversational: "I'd like a table for 4 people." |

---

## 2. Security & Safety

| # | Issue | Severity | Effort | Fix |
|---|-------|----------|--------|-----|
| S1 | **API keys in `.env` file** — live Gemini and Groq keys in plaintext. If `.env` was ever committed (check `git log --all -- .env`), keys are in history. | 🔴 | S | Rotate immediately. Verify `.env` not in git history. Use env vars or a secret manager. |
| S2 | **No authentication** on any API endpoint — anyone can create, cancel, or look up any reservation. | 🟡 | M | Add session tokens or lightweight API key auth. |
| S3 | **No rate limiting** — unlimited `/api/chat` requests can drain LLM API quotas ($$$). | 🟠 | S | Add `slowapi` rate limiter (e.g. 20 req/min per session). |
| S4 | **No input length validation** — `ChatRequest.message` can be arbitrarily long, leading to expensive LLM calls and abuse. | 🟠 | S | Add `max_length=2000` on the Pydantic field + frontend character counter. |
| S5 | **CORS misconfiguration** — `allow_origins=["*"]` with `allow_credentials=True`. Browsers block this combination, but the intent is too permissive. | 🟡 | S | Restrict to known frontend origins (e.g. `localhost:5173`, `localhost:8000`). |
| S6 | **LLM prompt injection risk** — user messages go straight to the LLM with tool access. A crafted message could trick the LLM into cancelling all reservations. | 🟡 | L | Add guardrails: require explicit user confirmation before destructive tool calls (cancel, modify). |
| S7 | **Confirmation codes are guessable** — 6-char alphanumeric, no identity verification required for cancel. | 🟡 | S | Require phone number match before cancel/modify. |
| S8 | **Session IDs have no entropy requirement** — `"default"` is used for unauthenticated users, sharing state across everyone. | 🟡 | S | Generate server-side UUIDs; reject user-supplied session IDs. |
| S9 | **`TypeScript strict: true` is NOT enabled** — implicit `any`, unchecked nulls, and missing function types are all silent. | 🔴 | M | Add `"strict": true` to `tsconfig.app.json`. Fix ~12 resulting errors. |

---

## 3. Backend Architecture & Agent Intelligence

### 3a. Two-Stage Pipeline

| # | Finding | Impact | Effort | Recommendation |
|---|---------|--------|--------|----------------|
| A1 | **Double LLM call per message** adds 0.5–2s latency. For simple follow-ups ("yes"), this is wasteful. | 🟡 | M | Make Stage 1 optional: skip classification when all tools fit in context, or use a local classifier (regex/keyword for obvious intents). |
| A2 | **System prompt rebuilt every turn** — `_update_system_prompt` mutates the first message in the conversation list in-place. Works but fragile. | ⚪ | S | Build message list fresh each turn rather than mutating. |
| A3 | **Intent parsing is brittle** — `raw_response.replace(" ", "").split(",")` fails on newlines or extra whitespace some models emit. | 🟡 | S | Strip each part, filter empties, handle newline-separated lists. |

### 3b. Conversation Intelligence

| # | Finding | Impact | Effort | Recommendation |
|---|---------|--------|--------|----------------|
| A4 | **No slot-filling state machine** — no structured tracking of gathered info (cuisine ✓, date ✓, time ✗, name ✗). Works with GPT-4o, unreliable with Qwen 7B. | 🟠 | L | Add a `SlotTracker` that records what's been collected; inject missing-slot prompts into system message. |
| A5 | **No confirmation enforcement before booking** — prompt says "confirm before booking" but nothing prevents an eager LLM from calling `create_reservation` immediately. | 🟠 | M | Add a "confirmation required" gate: agent must call a `confirm_booking_details` tool before `create_reservation` is allowed. |
| A6 | **`selected_restaurant` is fragile** — overwritten on every search. No way to reference "the Italian place we talked about earlier." | 🟡 | M | Track a list of `mentioned_restaurants` with timestamps; let the agent reference them by position. |
| A7 | **Empty user message accepted** — goes through the full two-stage pipeline. | ⚪ | S | Reject empty/whitespace-only messages at the API layer. |
| A8 | **Max iterations (5) with no bail-out on repeated errors** — the loop can spin if the LLM keeps calling tools that fail. | 🟡 | S | Track consecutive errors; bail after 2 in a row. |
| A9 | **No timezone awareness** — `datetime.now()` in system prompt uses server timezone. A user in a different timezone sees wrong "today". | 🟡 | M | Accept timezone in API request; inject into system prompt. |

### 3c. Tool System

| # | Finding | Impact | Effort | Recommendation |
|---|---------|--------|--------|----------------|
| T1 | **No phone number validation** — "call-me-maybe" is accepted as a valid phone. | 🟡 | S | Add regex validation in `create_reservation` tool. |
| T2 | **`get_restaurant_details` uses substring matching** — "Bella" matches "Bella Notte" but could match unintended names. | ⚪ | S | Prefer exact match first; fall back to substring. |
| T3 | **`check_availability` doesn't account for reservation duration** — a booking at 19:00 only blocks the 19:00 slot, not 19:30–20:00. Two adjacent bookings can exceed capacity. | 🟡 | M | Block slots within `DEFAULT_RESERVATION_DURATION_MINUTES` of existing bookings. |
| T4 | **Can cancel already-cancelled reservations** — `db.cancel_reservation` doesn't check current status. | ⚪ | S | Check status before cancelling; return error if already cancelled. |
| T5 | **Missing tools users expect**: `get_menu` (full menu), `get_wait_time`, `get_faq`. | 🟡 | M | Implement at least `get_menu` with expanded dish data. |
| T6 | **`get_recommendations` dietary mismatch penalty is mild** (-20 score). For allergies, this should be a hard exclusion, not a soft penalty. | 🟡 | S | Add `allergy` vs `preference` distinction; allergies = hard exclude. |

---

## 4. Database & Data Layer

| # | Finding | Impact | Effort | Recommendation |
|---|---------|--------|--------|----------------|
| D1 | **Everything is in-memory** — server restart loses all reservations. Acceptable for demo, but blocks production features (persistence, analytics, export). | 🟠 | L | Migrate to SQLite via `sqlite3` stdlib (no ORM needed). Keep in-memory as test/dev fallback. |
| D2 | **`base_available = capacity // 3`** is arbitrary. A 90-seat restaurant shows 30 slots per time. No day-of-week or seasonal variation. | 🟡 | M | Add basic demand modeling: weekends busier, dinner peak hours have fewer slots. |
| D3 | **Party size filter uses `capacity >= party_size * 0.9`** — a party of 10 can book a 9-seat restaurant. The 0.9 flex doesn't make sense for party size. | 🟡 | S | Use exact `capacity >= party_size`. |
| D4 | **No confirmation code uniqueness check** — 36^6 ≈ 2.2B combinations, collision near-impossible at demo scale, but no guard. | ⚪ | S | Add a while-loop retry on collision. |
| D5 | **All restaurants share only 2 hour variants** (11:00–22:00, 10:00–23:00). No brunch-only, late-night, or lunch-only restaurants. | 🟡 | S | Add 3–4 more hour patterns: breakfast (7–15), late-night (17–02), brunch (9–16). |
| D6 | **Missing data real users need**: no photos, no full menu with prices, no review text, no dress code, no payment methods, no wait time estimates. | 🟠 | M–L | Add per-template: 5–8 menu items with prices, image placeholder URLs (Unsplash), 2–3 review snippets. |
| D7 | **`get_neighborhoods()` and `get_cuisine_types()` recompute on every call** — iterates all 75 restaurants each time. | ⚪ | S | Cache as instance variables after seed. |

---

## 5. LLM Provider Layer

| # | Finding | Impact | Effort | Recommendation |
|---|---------|--------|--------|----------------|
| P1 | **No retry logic** — a transient 429/500/503 from any provider fails immediately. | 🟠 | M | Add exponential backoff (3 retries, 1s/2s/4s) for 429/500/503 in `_post()`. |
| P2 | **No streaming support** — `stream: False` hardcoded everywhere. Long responses = dead air in the UI. | 🟠 | L | Add SSE streaming endpoint; update frontend to consume `ReadableStream`. |
| P3 | **No connection pooling** — each `requests.post()` creates a new TCP connection. | ⚪ | S | Use `requests.Session()` per provider instance. |
| P4 | **Tool argument types are fragile** — Ollama returns `dict`, OpenAI sometimes returns JSON string. `_parse_tool_calls` handles both, but silently. | ⚪ | S | Normalize in provider layer before returning to agent. |

---

## 6. Server / API Layer

| # | Finding | Impact | Effort | Recommendation |
|---|---------|--------|--------|----------------|
| V1 | **No session expiry/cleanup** — sessions accumulate in memory forever. | 🟡 | M | Add TTL-based cleanup (e.g. 2 hours) or LRU eviction with cap (e.g. 100 sessions). |
| V2 | **Thread-unsafe session state** — `agent.chat()` is synchronous and mutates `ConversationState` without locks. Two concurrent requests for the same session corrupt state. | 🟠 | M | Add per-session `threading.Lock` or move to async. |
| V3 | **No session limit** — an attacker can create unlimited sessions, exhausting memory. | 🟡 | S | Cap max sessions (e.g. 200). |
| V4 | **SPA catch-all `/{full_path:path}`** could serve unintended files from `frontend/dist`. | ⚪ | S | Validate path doesn't contain `..` or sensitive patterns. |

---

## 7. Frontend Architecture & Code Quality

| # | Finding | Impact | Effort | Recommendation |
|---|---------|--------|--------|----------------|
| F1 | **No request cancellation** — `sendChatMessage` has no `AbortController`. Double-click on quick prompts races two requests; both responses append. | 🔴 | S | Store `AbortController` ref in App; abort previous on new send. |
| F2 | **No fetch timeout** — a hung backend means the spinner runs forever. | 🟠 | S | Add `AbortSignal.timeout(30_000)` to each fetch call. |
| F3 | **`Date.now()` for message IDs** — two messages in the same millisecond get the same ID. | 🟡 | S | Use `crypto.randomUUID()`. |
| F4 | **Double unsafe cast** — `(dataObj.reservation || dataObj) as unknown as Reservation`. | 🟡 | S | Define a `CreateReservationResponse` interface; use type guard. |
| F5 | **Duplicate `date`/`time` vs `reservation_date`/`reservation_time`** in Reservation type. Every consumer checks both. | 🟡 | S | Normalize to one pair at the API boundary in `api.ts`. |
| F6 | **Status type union `"confirmed" | ... | string`** — the `| string` escape hatch makes the enum useless. | 🟡 | S | Remove `| string`; use a strict union. |
| F7 | **Dead dependencies** — `clsx` and `tailwind-merge` installed but never imported. | ⚪ | S | `npm uninstall clsx tailwind-merge`. |
| F8 | **Duplicate cuisine access pattern** — `r.cuisine_types || r.cuisines || []` repeated in 3+ files. | 🟡 | S | Create a `getCuisines(r)` helper in `api.ts` or normalize there. |
| F9 | **Named AND default export** in App.tsx. | ⚪ | S | Pick one; named is used in `main.tsx`. |
| F10 | **Hardcoded `'75 Locations'`** in Header, ChatArea, and ExplorerModal. Should use `config.stats.restaurants_count`. | 🟡 | S | Use config value. |
| F11 | **No code splitting** — all 10 components eagerly imported. Modals (ExplorerModal 8.3KB, ModelPicker 8KB, Drawer 7KB) should be lazy. | 🟡 | S | `React.lazy()` + `<Suspense>`. |
| F12 | **`sendChatMessage` has unused `provider`/`model`/`useMock` params** that App never passes. | ⚪ | S | Wire them up or remove. |
| F13 | **Rogue hex values** — `#FFFDF7`, `#FFFDF8`, `#FFFDE8` used directly instead of Tailwind tokens. | ⚪ | S | Add as `neo-cream-warm` / `neo-cream-light` tokens. |

---

## 8. UI / UX & Accessibility

### 8a. Accessibility (Critical)

| # | Finding | Impact | Effort | Fix |
|---|---------|--------|--------|-----|
| U1 | **No focus trap on any modal/drawer** — Tab moves focus behind the overlay. All 3 modals affected. | 🔴 | M | Add focus-trap logic (`useFocusTrap` hook or `focus-trap-react`). |
| U2 | **Modals don't close on Escape key** — no `keydown` listener. | 🟠 | S | Add `useEffect` with `keydown` Escape → `onClose()`. |
| U3 | **Modals don't close on backdrop click.** | 🟡 | S | Add `onClick={onClose}` on overlay with `e.stopPropagation()` on the card. |
| U4 | **No `role="dialog"` or `aria-modal="true"`** on any modal. Screen readers don't detect them as dialogs. | 🔴 | S | Add `role="dialog"` `aria-modal="true"` `aria-labelledby` to each modal root. |
| U5 | **Missing form labels** — chat input has `placeholder` only, no `aria-label`. QuickBookingBar labels lack `htmlFor`/`id`. | 🟠 | S | Add proper label associations. |
| U6 | **Copy button is keyboard-inaccessible** — `opacity-0` until `group-hover`, unreachable by keyboard. | 🟠 | S | Add `focus-within:opacity-100` alongside `group-hover:opacity-100`. |
| U7 | **No skip-to-content link** for keyboard/screen-reader users. | 🟡 | S | Add a visually-hidden skip link before the header. |
| U8 | **`animate-bounce` on badge** lacks `prefers-reduced-motion` guard. | ⚪ | S | Add `motion-safe:animate-bounce`. |

### 8b. UX Gaps

| # | Finding | Impact | Effort | Fix |
|---|---------|--------|--------|-----|
| U9 | **No chat history persistence** — page refresh clears all messages. | 🟠 | M | Persist to `sessionStorage` or fetch history from backend. |
| U10 | **`alert()` used for cancel errors** — blocks UI thread, no styling. | 🟠 | S | Replace with inline toast/banner. |
| U11 | **No confirmation before "New Chat"** — wipes all messages instantly. | 🟡 | S | Add "Are you sure?" confirmation step. |
| U12 | **No message timestamps displayed** — `ChatMessage` has `timestamp` but never rendered. | 🟡 | S | Show relative times ("2 min ago") under each bubble. |
| U13 | **No modify button on ReservationTicket** — users must type in chat to modify. | 🟡 | S | Add a "Modify" button that opens an inline edit form or sends a pre-built chat message. |
| U14 | **Restaurant Explorer has no sort** — can filter but not sort by rating, price, etc. | 🟡 | S | Add a sort dropdown (Rating ↓, Price ↑, Name A–Z). |
| U15 | **No loading skeletons** — loading states show "⏳ Loading..." text. Looks janky. | 🟡 | M | Replace with shimmer skeleton components. |
| U16 | **No "taking longer than expected" message** — 2 minute timeout with just a spinner. | 🟡 | S | Show warning after 15 seconds. |
| U17 | **Config load failure is silent** — if config fetch fails, app runs with `config: null` and no retry option. | 🟠 | M | Show top-level error banner with retry button. |
| U18 | **No dark mode.** | ⚪ | L | Add dark mode toggle with Tailwind `dark:` variant. |
| U19 | **No edit/retry on sent messages** — standard chat UX expectation. | 🟡 | M | Add edit/retry buttons on user message bubbles. |
| U20 | **Touch targets undersized** — many buttons are `py-0.5` with `text-[10px]`. Below 44×44px recommended minimum. | 🟠 | S | Increase min touch target to 36–44px. |
| U21 | **QuickBookingBar horizontal scroll has no visual indicator** on mobile. | 🟡 | S | Add fade-out gradient or scroll arrows. |

### 8c. Design System

| # | Finding | Impact | Effort | Fix |
|---|---------|--------|--------|-----|
| U22 | **`border-black/30` and `border-black/40`** break Neobrutalism's solid, high-contrast border rule. | ⚪ | S | Replace with `border-gray-400` or `border-black`. |
| U23 | **`backdrop-blur-sm`** on modal overlays clashes with the hard-edge aesthetic. | ⚪ | S | Remove blur. |
| U24 | **Some buttons lack resting `shadow-neo`** — tab buttons have shadow only when active, unlike `btn-neo` class. | ⚪ | S | Add consistent resting shadows. |

---

## 9. Performance

| # | Finding | Impact | Effort | Fix |
|---|---------|--------|--------|-----|
| R1 | **ReactMarkdown re-creates `remarkPlugins` array each render** — defeats memoization across all N message bubbles. | 🟠 | S | Hoist `remarkPlugins` to a module-level constant. |
| R2 | **No `React.memo` on message items** — every state change re-renders every message. | 🟡 | S | Wrap message list items in `React.memo`. |
| R3 | **No `useCallback` anywhere** — event handlers recreated every render, causing child re-renders. | 🟡 | S | Wrap stable callbacks in `useCallback`. |
| R4 | **75 restaurant cards all render at once** — no virtualization. | 🟡 | M | Add `react-window` or intersection-observer lazy rendering. |
| R5 | **Google Fonts CSS import is render-blocking** (`index.css:1`). | 🟡 | S | Use `<link rel="preload">` with `font-display: swap`, or self-host. |
| R6 | **Conversation `messages` list grows unbounded in memory** — only formatting caps at 20, but the actual list never trims. | 🟡 | S | Trim the list itself periodically. |
| R7 | **No HTTP connection pooling for LLM calls** — new TCP connection per `requests.post()`. | ⚪ | S | Use `requests.Session()` per provider. |

---

## 10. Testing

| # | What's Missing | Impact | Effort |
|---|----------------|--------|--------|
| X1 | **No tests for `agent.py`** — intent classification, tool loop, conversation state, message formatting. | 🔴 | M |
| X2 | **No tests for `tools.py`** — search, recommendations, reservation CRUD, parameter validation. | 🔴 | M |
| X3 | **No tests for `database.py`** — availability logic, search filters, reservation lifecycle. | 🔴 | M |
| X4 | **No tests for `server.py`** — endpoint behavior, session management, error responses. | 🟠 | M |
| X5 | **No integration test** — end-to-end chat flow with mock LLM verifying the full pipeline. | 🟠 | M |
| X6 | **No frontend tests** — no test framework even installed. | 🟡 | L |
| X7 | **No edge case tests** — empty input, concurrent requests, max iterations, invalid dates. | 🟡 | M |
| X8 | **Existing 6 tests only cover** provider instantiation and Gemini format translation. Good but narrow. | — | — |

---

## 11. Documentation & Demo-ability

| # | Finding | Impact | Effort | Fix |
|---|---------|--------|--------|-----|
| O1 | **README references Streamlit** but app uses FastAPI + React. Quick Start is wrong. "Built with Streamlit" in Acknowledgments. | 🔴 | S | Full README rewrite for the actual architecture. |
| O2 | **Frontend setup instructions missing** — no mention of `cd frontend && npm install && npm run dev`, Node.js requirement, or Vite dev server. | 🔴 | S | Add to Quick Start, Prerequisites. |
| O3 | **Two processes required but undocumented** — backend + frontend need to run together. | 🟠 | S | Document both; add a `Makefile` or root script: `make dev` starts both. |
| O4 | **Production build path undocumented** — `npm run build` + single `uvicorn` server works (server.py mounts `frontend/dist`) but nobody knows. | 🟡 | S | Document in README. |
| O5 | **No prerequisite list for Node.js/npm.** | 🟠 | S | Add to Prerequisites section. |
| O6 | **Offline Demo Mode exists but is buried** inside the Model Picker Modal. A first-time user who just wants to try it doesn't know. | 🟡 | S | Surface as a prominent option when no provider is configured; or make it the default for unconfigured state. |
| O7 | **No GIF/screenshot in README** showing the UI. | 🟡 | S | Record a 30-second demo GIF. |

---

## 12. Transformative Feature Ideas

These are the features that would elevate this project from "impressive demo" to "genuinely outstanding portfolio piece."

### Tier 1 — High Impact, Achievable (do these first)

| # | Feature | Why It's Transformative | Effort |
|---|---------|------------------------|--------|
| 🌟 1 | **Streaming Responses (SSE)** | Eliminates the worst UX problem: dead air while waiting for LLM response. Makes the app feel alive and production-grade. Every major AI product streams. | L |
| 🌟 2 | **Intent Classification Badge** | Display detected intents as a colored pill above each response (e.g. `🔍 SEARCH + 📋 RESERVE`). Directly showcases the two-stage architecture to interviewers. Zero complexity, high "wow." | S |
| 🌟 3 | **Conversation Analytics Panel** | Slide-out dev panel showing: token usage per stage, latency breakdown (classify vs. generate), tool calls per turn, model name, provider. Technical interviewers love seeing the engineering behind the curtain. | M |
| 🌟 4 | **Restaurant Images** | Even Unsplash placeholder images mapped by cuisine type in RestaurantCard make the Explorer modal 5× more visually impressive. | S |
| 🌟 5 | **Persistent SQLite Storage** | Reservations survive restarts. Enables analytics, export, and the foundation for guest profiles. Uses stdlib `sqlite3` — no new deps. | L |
| 🌟 6 | **Voice Interface** | Web Speech API for input + browser TTS for response. Makes live demos 10× more impressive. The "show it to someone" factor. | M |

### Tier 2 — Differentiating Intelligence

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 🧠 7 | **Guest Memory & VIP Profiles** | Remember dietary restrictions, seating preferences, visit history, special dates (anniversaries). Greeting: "Welcome back! Looking for another quiet Italian spot?" | M |
| 🧠 8 | **Structured Slot-Filling** | Track what info has been gathered (cuisine ✓, date ✓, time ✗, name ✗). Inject missing-slot prompts. Works reliably even with small models. | L |
| 🧠 9 | **Smart Conflict Resolution** | When a slot is unavailable, automatically propose: (a) 30 min earlier/later at same venue, (b) same time at sister location, (c) waitlist with notification. | M |
| 🧠 10 | **Semantic "Vibe" Search** | Vector embeddings for restaurant descriptions. Handle queries like "somewhere dim-lit with soft jazz" or "vibrant spot with sharing plates." | L |

### Tier 3 — Production Polish

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 📲 11 | **Calendar Download (.ics)** | 1-click "Add to Calendar" button on ReservationTicket. Generates `.ics` with venue, time, confirmation code, restaurant phone. | S |
| 📲 12 | **QR Code on Ticket** | Generate a QR code encoding the confirmation code on the ReservationTicket. Makes the boarding-pass metaphor real. | S |
| 📲 13 | **Email/SMS Confirmation** | Twilio/SendGrid integration for actual booking receipts. Optional, behind a feature flag. | M |
| 📲 14 | **Pre-seeded Demo Conversation** | Auto-play a scripted 30-second conversation showing the full discovery → booking flow. Perfect for README GIF or live demo. | M |
| 📲 15 | **Export Booking as PDF** | Downloadable PDF receipt from ReservationTicket. Uses browser `print()` CSS or `html2canvas`. | S |

---

## 13. Prioritized Roadmap

### Sprint 0 — Critical Fixes (1–2 hours)

Everything here is broken right now and takes minutes to fix.

- [ ] **B4**: Seed RNG — `random.seed(42)` in `_seed_restaurants()`
- [ ] **B1**: Pass last 3 conversation turns to intent classifier
- [ ] **B2**: Add date/time/party_size validation in `create_reservation`
- [ ] **B3**: Fix availability double-booking (`defaultdict(int)`)
- [ ] **B7**: Rewrite README Quick Start for FastAPI + React
- [ ] **B8**: Remove hardcoded PII from QuickBookingBar
- [ ] **B9**: Fix invalid `py-0.2` Tailwind classes
- [ ] **S1**: Rotate API keys; verify `.env` not in git history
- [ ] **B10**: Clean up `requirements.txt`

### Sprint 1 — Foundations (half day)

- [ ] **S9**: Enable `strict: true` in TypeScript
- [ ] **F1**: Add `AbortController` to prevent double-send race
- [ ] **F2**: Add fetch timeouts
- [ ] **U1**: Add focus traps to all modals
- [ ] **U2**: Escape key closes modals
- [ ] **U4**: Add `role="dialog"` and `aria-modal="true"`
- [ ] **R1**: Hoist `remarkPlugins` to module constant
- [ ] **B5**: Implement or remove `get_faq` from intent mapping
- [ ] **B6**: Remove dead state fields
- [ ] **O2**: Document frontend setup in README

### Sprint 2 — Intelligence & Polish (1–2 days)

- [ ] **🌟 2**: Add intent classification badge to UI
- [ ] **🌟 4**: Add restaurant placeholder images
- [ ] **U10**: Replace `alert()` with toast notifications
- [ ] **U13**: Add Modify button to ReservationTicket
- [ ] **U14**: Add sort to Restaurant Explorer
- [ ] **P1**: Add retry logic with exponential backoff
- [ ] **V2**: Add per-session threading lock
- [ ] **X1–X3**: Write tests for agent, tools, database
- [ ] **📲 11**: Add .ics calendar download
- [ ] **📲 12**: Add QR code to ReservationTicket

### Sprint 3 — Transformative Features (3–5 days)

- [ ] **🌟 1**: Implement streaming responses (SSE)
- [ ] **🌟 3**: Build conversation analytics panel
- [ ] **🌟 5**: Migrate to SQLite persistent storage
- [ ] **🌟 6**: Add voice interface (Web Speech API)
- [ ] **🧠 8**: Build structured slot-filling
- [ ] **🧠 9**: Smart conflict resolution

### Sprint 4 — Elite Tier (1–2 weeks)

- [ ] **🧠 7**: Guest memory & VIP profiles
- [ ] **🧠 10**: Semantic vibe search with embeddings
- [ ] **📲 13**: Email/SMS confirmation via Twilio
- [ ] **📲 14**: Pre-seeded demo conversation
- [ ] **U18**: Dark mode
- [ ] **Full test coverage**: frontend tests, integration tests, edge cases

---

## Appendix: Current Scorecard

| Dimension | Score | After Sprint 0–1 | After Sprint 2–3 | Target |
|-----------|-------|-------------------|-------------------|--------|
| **Correctness** | 6/10 | 9/10 | 9/10 | 9/10 |
| **Agent Intelligence** | 6/10 | 7/10 | 8/10 | 9/10 |
| **Security** | 4/10 | 7/10 | 8/10 | 8/10 |
| **Accessibility** | 3/10 | 7/10 | 8/10 | 9/10 |
| **Performance** | 7/10 | 8/10 | 9/10 | 9/10 |
| **Testing** | 3/10 | 3/10 | 7/10 | 8/10 |
| **Documentation** | 4/10 | 8/10 | 9/10 | 9/10 |
| **UX Polish** | 7/10 | 8/10 | 9/10 | 10/10 |
| **"Wow" Factor** | 7/10 | 7/10 | 9/10 | 10/10 |
| **Overall** | **5.2/10** | **7.1/10** | **8.4/10** | **9.0/10** |
