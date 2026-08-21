"""FastAPI backend for GoodFoods AI Concierge.

Exposes REST APIs for chat, restaurant discovery, reservation management,
and LLM provider configuration. Serves the React frontend when built.
"""
from typing import Any, Dict, List, Optional
import os
from pathlib import Path

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import (
    APP_VERSION,
    AVAILABLE_MODELS,
    DEFAULT_MODELS,
    LLM_PROVIDER,
    PROVIDER_LABELS,
    SUPPORTED_PROVIDERS,
)
from database import db
from agent import create_agent
from llm_providers import LLMError
from neon_db import neon_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    if neon_db.enabled:
        neon_db.migrate()
    yield


app = FastAPI(
    title="GoodFoods AI Concierge API",
    version=APP_VERSION,
    description="Neobrutalist Dining Assistant Backend",
    lifespan=lifespan,
)

# CORS middleware for Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _dump_model(obj: Any) -> Dict[str, Any]:
    """Safely dump Pydantic or dataclass model to dict."""
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    if isinstance(obj, dict):
        return obj
    return getattr(obj, "__dict__", {})


def _serialize_reservation(res: Any) -> Dict[str, Any]:
    """Serialize reservation ensuring date/time and reservation_date/reservation_time compatibility."""
    data = _dump_model(res)
    date_val = str(data.get("date") or data.get("reservation_date") or "")
    time_val = str(data.get("time") or data.get("reservation_time") or "")
    data["date"] = date_val
    data["time"] = time_val
    data["reservation_date"] = date_val
    data["reservation_time"] = time_val
    return data



def _get_current_user(authorization: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Extract authenticated user from Authorization header if valid."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    if not token or not neon_db.enabled:
        return None
    return neon_db.get_user_by_token(token)

# ---------------------------------------------------------------------------
# Session Manager (Multi-Client Isolated State)
# ---------------------------------------------------------------------------

class SessionStore:
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self.default_provider: str = LLM_PROVIDER
        self.default_model: str = DEFAULT_MODELS.get(LLM_PROVIDER, "")

    def get_or_create(self, session_id: str = "default") -> Dict[str, Any]:
        sid = session_id.strip() if session_id else "default"
        if sid not in self._sessions:
            agent = create_agent(
                provider=self.default_provider,
                model=self.default_model,
                use_mock=False,
            )
            if neon_db.enabled:
                neon_db.save_session(sid, self.default_provider, self.default_model, False)
            self._sessions[sid] = {
                "agent": agent,
                "provider": self.default_provider,
                "model": self.default_model,
                "use_mock": False,
            }
        return self._sessions[sid]

    def switch_model(
        self, session_id: str, provider: str, model: str, use_mock: bool = False
    ) -> Dict[str, Any]:
        """Switch LLM backend while preserving ongoing conversation state."""
        s = self.get_or_create(session_id)
        old_conversation = getattr(s["agent"], "conversation", None)
        s["provider"] = provider
        s["model"] = model
        s["use_mock"] = use_mock

        if use_mock:
            s["agent"] = create_agent(use_mock=True)
        else:
            s["agent"] = create_agent(provider=provider, model=model)

        if old_conversation is not None:
            s["agent"].conversation = old_conversation

        llm = getattr(s["agent"], "llm", None)
        if llm:
            ready, reason = llm.is_configured()
        else:
            ready, reason = True, "Demo mode active"

        return {
            "provider": provider,
            "model": model,
            "use_mock": use_mock,
            "ready": ready,
            "status": reason,
        }

    def reset_conversation(self, session_id: str = "default"):
        sid = session_id.strip() if session_id else "default"
        if sid in self._sessions:
            self._sessions[sid]["agent"].reset_conversation()


store = SessionStore()


# ---------------------------------------------------------------------------
# Request/Response Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    provider: Optional[str] = None
    model: Optional[str] = None
    use_mock: Optional[bool] = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class SwitchProviderRequest(BaseModel):
    provider: str
    model: str
    use_mock: Optional[bool] = False
    session_id: Optional[str] = "default"


class CancelReservationRequest(BaseModel):
    confirmation_code: str

# ---------------------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/auth/register")
def register(payload: RegisterRequest):
    """Register a new customer account."""
    if not neon_db.enabled:
        raise HTTPException(status_code=503, detail="Database persistence not configured")
    if not payload.email or "@" not in payload.email:
        raise HTTPException(status_code=400, detail="Valid email address is required")
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    try:
        user = neon_db.create_user(
            email=payload.email,
            password=payload.password,
            name=payload.name,
            phone=payload.phone
        )
        token = neon_db.create_auth_session(user["id"])
        return {"token": token, "user": user}
    except Exception as e:
        err_str = str(e).lower()
        if "unique" in err_str or "duplicate" in err_str or "users_email" in err_str:
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    """Log in an existing customer and return an auth bearer token."""
    if not neon_db.enabled:
        raise HTTPException(status_code=503, detail="Database persistence not configured")
    user = neon_db.authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = neon_db.create_auth_session(user["id"])
    return {"token": token, "user": user}


@app.get("/api/auth/me")
def get_me(authorization: Optional[str] = Header(default=None)):
    """Verify token and return current authenticated user profile."""
    user = _get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated or session expired")
    return {"user": user}


@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(default=None)):
    """Revoke session token on logout."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        if token and neon_db.enabled:
            neon_db.delete_auth_session(token)
    return {"status": "logged_out"}


@app.get("/api/config")
def get_config(x_session_id: Optional[str] = Header(default="default")):
    """Return backend configuration, supported providers, and system metrics."""
    s = store.get_or_create(x_session_id or "default")
    agent = s["agent"]
    llm = getattr(agent, "llm", None)
    ready, status_reason = llm.is_configured() if llm else (True, "Demo mode active")

    return {
        "app_version": APP_VERSION,
        "providers": list(SUPPORTED_PROVIDERS),
        "provider_labels": PROVIDER_LABELS,
        "available_models": AVAILABLE_MODELS,
        "default_models": DEFAULT_MODELS,
        "active_provider": s["provider"],
        "active_model": s["model"],
        "use_mock": s["use_mock"],
        "status": {
            "ready": ready,
            "reason": status_reason,
            "backend": llm.describe() if llm else "Demo mode",
        },
        "stats": {
            "restaurants_count": len(db.restaurants),
            "neighborhoods": db.get_neighborhoods(),
            "cuisines": db.get_cuisine_types(),
            "active_reservations_count": len(db.reservations),
        },
    }


@app.post("/api/config/provider")
def switch_provider(payload: SwitchProviderRequest):
    """Switch model/provider without dropping conversational memory."""
    try:
        verdict = store.switch_model(
            session_id=payload.session_id or "default",
            provider=payload.provider,
            model=payload.model,
            use_mock=bool(payload.use_mock),
        )
        return verdict
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/chat")
def chat(payload: ChatRequest, authorization: Optional[str] = Header(default=None)):
    """Process a user message and return agent response with structured tool results.
    Open endpoint - works for both authenticated and guest users."""
    sid = payload.session_id or "default"
    s = store.get_or_create(sid)
    current_user = _get_current_user(authorization)
    user_id = current_user["id"] if current_user else None

    # Switch provider if requested explicitly in payload
    if payload.provider and (payload.provider != s["provider"] or payload.model != s["model"]):
        store.switch_model(
            session_id=sid,
            provider=payload.provider,
            model=payload.model or DEFAULT_MODELS.get(payload.provider, ""),
            use_mock=bool(payload.use_mock),
        )
        s = store.get_or_create(sid)

    agent = s["agent"]
    if neon_db.enabled:
        neon_db.save_message(sid, "user", payload.message)
        neon_db.save_session(sid, s["provider"], s["model"], s["use_mock"], user_id)

    try:
        response_text = agent.chat(payload.message)
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal agent error: {str(e)}")

    if neon_db.enabled:
        neon_db.save_message(sid, "assistant", response_text)

    # Extract tool results and state
    last_results = getattr(agent.conversation, "last_tool_results", [])
    serialized_tools = []
    for tr in last_results or []:
        tr_data = getattr(tr, "data", None)
        # If tool created a reservation and user is logged in, attach user_id to reservation
        if getattr(tr, "tool_name", "") == "create_reservation" and getattr(tr, "success", False) and isinstance(tr_data, dict):
            code = tr_data.get("confirmation_code")
            if code and user_id:
                res_obj = db.get_reservation_by_code(code)
                if res_obj:
                    res_obj.user_id = user_id
                    if neon_db.enabled:
                        neon_db.update_reservation(db._reservation_data(res_obj))
            tr_data = _serialize_reservation(tr_data)

        serialized_tools.append({
            "tool_name": getattr(tr, "tool_name", ""),
            "success": getattr(tr, "success", True),
            "data": tr_data,
            "error": getattr(tr, "error", None),
        })

    # Featured venue if requested explicitly
    selected_restaurant = None
    if any(getattr(tr, "tool_name", "") == "get_restaurant_details" and getattr(tr, "success", False) for tr in last_results):
        raw_restaurant = getattr(agent.conversation, "selected_restaurant", None)
        if isinstance(raw_restaurant, dict):
            rest_id = raw_restaurant.get("id") or raw_restaurant.get("restaurant_id")
            selected_restaurant = _dump_model(db.restaurants[rest_id]) if rest_id in db.restaurants else raw_restaurant
        elif raw_restaurant is not None:
            selected_restaurant = _dump_model(raw_restaurant)

    active_reservations = []
    if current_user:
        active_reservations = [_serialize_reservation(res) for res in db.get_reservations_by_user(current_user["id"])]

    return {
        "response": response_text,
        "provider": s["provider"],
        "model": s["model"],
        "tool_results": serialized_tools,
        "selected_restaurant": selected_restaurant,
        "active_reservations": active_reservations,
    }

@app.get("/api/restaurants")
def list_restaurants(
    cuisine: Optional[str] = None,
    neighborhood: Optional[str] = None,
    search: Optional[str] = None,
):
    """Search and filter the 75-restaurant directory."""
    c_lower = cuisine.lower() if cuisine else None
    n_lower = neighborhood.lower() if neighborhood else None
    s_lower = search.lower() if search else None

    return [
        _dump_model(r)
        for r in db.restaurants.values()
        if (not c_lower or any(c_lower in ct.value.lower() for ct in r.cuisine_types))
        and (not n_lower or n_lower in r.neighborhood.lower())
        and (
            not s_lower
            or s_lower in r.name.lower()
            or s_lower in r.description.lower()
            or any(s_lower in d.lower() for d in r.popular_dishes)
        )
    ]


@app.get("/api/reservations")
def list_reservations(authorization: Optional[str] = Header(default=None)):
    """List reservations belonging to the authenticated user."""
    user = _get_current_user(authorization)
    if user:
        return [_serialize_reservation(r) for r in db.get_reservations_by_user(user["id"])]
    return []


@app.post("/api/reservations/cancel")
def cancel_reservation(
    payload: CancelReservationRequest,
    authorization: Optional[str] = Header(default=None),
):
    """Cancel a booking. Only authenticated users can cancel their own reservations."""
    user = _get_current_user(authorization)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Please log in to cancel or change your reservations.",
        )

    res = db.get_reservation_by_code(payload.confirmation_code.strip())
    if not res:
        raise HTTPException(
            status_code=404,
            detail=f"Reservation '{payload.confirmation_code}' not found.",
        )

    # Ownership verification
    res_user_id = getattr(res, "user_id", None)
    if res_user_id and res_user_id != user["id"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You do not have permission to cancel this reservation.",
        )

    cancelled = db.cancel_reservation(payload.confirmation_code.strip())
    return {"success": True, "reservation": _serialize_reservation(cancelled)}
@app.post("/api/reset")
def reset_conversation(x_session_id: Optional[str] = Header(default="default")):
    """Reset the chat history and active agent memory for this session."""
    store.reset_conversation(x_session_id or "default")
    return {"status": "success", "message": "Conversation memory cleared"}


# ---------------------------------------------------------------------------
# Static SPA Mount (for production React build)
# ---------------------------------------------------------------------------

FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("server:app", host=host, port=port, reload=True)
