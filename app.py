import streamlit as st
from datetime import datetime, timedelta

st.set_page_config(
    page_title="GoodFoods AI Concierge",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded"
)

from agent import create_agent, ReservationAgent, MockReservationAgent
from config import (
    APP_VERSION, AVAILABLE_MODELS, DEFAULT_MODELS,
    LLM_PROVIDER, PROVIDER_LABELS, SUPPORTED_PROVIDERS
)
from database import db


st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1E3A5F;
        margin-bottom: 0.5rem;
    }
    .sub-header {
        font-size: 1.1rem;
        color: #4A90A4;
        margin-bottom: 2rem;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
    }
    .user-message {
        background-color: #E8F4F8;
        border-left: 4px solid #4A90A4;
    }
    .assistant-message {
        background-color: #F5F5F5;
        border-left: 4px solid #1E3A5F;
    }
    .restaurant-card {
        background-color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #ddd;
        margin-bottom: 0.5rem;
    }
    .stat-box {
        background-color: #F0F7FA;
        padding: 1rem;
        border-radius: 0.5rem;
        text-align: center;
    }
    .stat-number {
        font-size: 2rem;
        font-weight: bold;
        color: #1E3A5F;
    }
    .stat-label {
        color: #666;
        font-size: 0.9rem;
    }
</style>
""", unsafe_allow_html=True)


def refresh_agent_status():
    """Probe the backend once and cache the verdict.

    Kept out of the render path on purpose: Streamlit re-runs the whole script
    on every interaction, and the Ollama probe is a network call. Caching keeps
    an unreachable backend from adding latency to each message.
    """
    agent = st.session_state.get("agent")
    llm = getattr(agent, "llm", None)
    st.session_state.agent_status = llm.is_configured() if llm else None


def build_agent():
    """(Re)build the agent from the provider/model currently selected."""
    if st.session_state.use_mock:
        st.session_state.agent = create_agent(use_mock=True)
        st.session_state.agent_error = None
        refresh_agent_status()
        return

    try:
        st.session_state.agent = create_agent(
            provider=st.session_state.provider,
            model=st.session_state.model,
        )
        st.session_state.agent_error = None
    except Exception as e:
        st.session_state.agent = None
        st.session_state.agent_error = str(e)

    refresh_agent_status()


def initialize_session_state():
    if "messages" not in st.session_state:
        st.session_state.messages = []

    if "provider" not in st.session_state:
        st.session_state.provider = LLM_PROVIDER
    if "model" not in st.session_state:
        st.session_state.model = DEFAULT_MODELS.get(LLM_PROVIDER, "")
    if "use_mock" not in st.session_state:
        st.session_state.use_mock = False
    if "switched" not in st.session_state:
        st.session_state.switched = False

    if "agent" not in st.session_state:
        build_agent()


def render_model_picker():
    """Provider + model selection. Changing either rebuilds the agent."""
    st.markdown("### 🧠 Model")

    providers = list(SUPPORTED_PROVIDERS)
    current_provider = st.session_state.provider
    provider = st.selectbox(
        "Provider",
        providers,
        index=providers.index(current_provider) if current_provider in providers else 0,
        format_func=lambda p: PROVIDER_LABELS.get(p, p),
        help="Cloud providers need an API key in .env; local providers do not.",
    )

    suggestions = AVAILABLE_MODELS.get(provider, [])
    current = st.session_state.model if provider == st.session_state.provider else ""
    options = list(suggestions)
    if current and current not in options:
        options.insert(0, current)
    options.append("Custom...")

    default_model = DEFAULT_MODELS.get(provider, "")
    preselect = current or default_model
    index = options.index(preselect) if preselect in options else 0

    choice = st.selectbox("Model", options, index=index)
    if choice == "Custom...":
        model = st.text_input(
            "Model id",
            value=preselect,
            placeholder="e.g. gemini-2.5-flash",
        ).strip()
    else:
        model = choice

    use_mock = st.checkbox(
        "Offline demo mode",
        value=st.session_state.use_mock,
        help="Answer with pattern matching only - no LLM calls",
    )

    changed = (provider, model, use_mock) != (
        st.session_state.provider,
        st.session_state.model,
        st.session_state.use_mock,
    )

    if changed and model:
        st.session_state.provider = provider
        st.session_state.model = model
        st.session_state.use_mock = use_mock
        st.session_state.switched = True
        build_agent()
        st.rerun()

    render_model_status()


def render_model_status():
    """Show the cached verdict for the selected backend."""
    error = st.session_state.get("agent_error")
    if error:
        st.error(f"Provider setup failed: {error}")
        return

    status = st.session_state.get("agent_status")
    if status is None:
        st.info("Offline demo mode - no LLM calls")
        return

    ready, reason = status
    if ready:
        st.success(reason)
    else:
        st.warning(reason)
        if st.button("Recheck connection", use_container_width=True):
            refresh_agent_status()
            st.rerun()

    if st.session_state.switched:
        st.caption("Model switched - the assistant's memory starts fresh.")


def render_sidebar():
    with st.sidebar:
        st.markdown("### 🍽️ GoodFoods AI")
        st.markdown("---")

        col1, col2 = st.columns(2)
        with col1:
            st.metric("Restaurants", "75")
        with col2:
            st.metric("Neighborhoods", str(len(db.get_neighborhoods())))

        st.markdown("---")

        render_model_picker()

        st.markdown("---")

        agent = st.session_state.get("agent")
        if st.button(
            "🔄 New Conversation", use_container_width=True, disabled=agent is None
        ):
            st.session_state.messages = []
            st.session_state.switched = False
            agent.reset_conversation()
            st.rerun()

        st.markdown("---")

        backend = (
            agent.llm.describe()
            if getattr(agent, "llm", None)
            else "Demo mode" if agent else "Provider unavailable"
        )
        st.markdown(
            f"""
        <small>
        <b>GoodFoods AI Concierge</b> v{APP_VERSION}<br>
        {backend}<br>
        Tool-calling architecture (MCP-style)
        </small>
        """,
            unsafe_allow_html=True,
        )


def render_chat_message(role: str, content: str):
    if role == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(content)
    else:
        with st.chat_message("assistant", avatar="🍽️"):
            st.markdown(content)


def render_welcome_message():
    welcome = """
## 👋 Welcome to GoodFoods AI Concierge!

I'm your personal dining assistant, ready to help you discover the perfect restaurant from our **75 locations** across Metro City.

### What I can help you with:

🔍 **Find Restaurants** - Search by cuisine, neighborhood, price, or ambiance

⭐ **Get Recommendations** - Tell me about your occasion and preferences

📅 **Make Reservations** - Book a table in seconds

📋 **Manage Bookings** - View, modify, or cancel existing reservations

---

### Try asking me:
- *"Find me a romantic Italian restaurant in Downtown"*
- *"I need a recommendation for a birthday dinner for 6"*
- *"What Japanese restaurants do you have?"*
- *"Book a table at Bella Notte for tomorrow at 7pm"*

**What would you like to do today?**
"""
    with st.chat_message("assistant", avatar="🍽️"):
        st.markdown(welcome)


def main():
    initialize_session_state()

    st.markdown('<p class="main-header">🍽️ GoodFoods AI Concierge</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Your personal dining assistant • 75 restaurants • Instant booking</p>', unsafe_allow_html=True)

    render_sidebar()

    chat_container = st.container()

    with chat_container:
        if not st.session_state.messages:
            render_welcome_message()
        else:
            for message in st.session_state.messages:
                render_chat_message(message["role"], message["content"])

    status = st.session_state.get("agent_status")
    if st.session_state.get("agent") is None or (status and not status[0]):
        st.info("Configure the selected backend or use Offline demo mode before chatting.")
        return

    if prompt := st.chat_input("Type your message here..."):
        st.session_state.messages.append({
            "role": "user",
            "content": prompt
        })

        with st.chat_message("user", avatar="👤"):
            st.markdown(prompt)

        with st.chat_message("assistant", avatar="🍽️"):
            with st.spinner("Thinking..."):
                try:
                    response = st.session_state.agent.chat(prompt)
                except Exception as e:
                    response = f"I apologize, but I encountered an error: {str(e)}\n\nPlease try again or check your API settings."

                st.markdown(response)

        st.session_state.messages.append({
            "role": "assistant",
            "content": response
        })

        st.rerun()


SAMPLE_CONVERSATIONS = [
    {
        "title": "Finding Italian Restaurants",
        "messages": [
            ("user", "I'm looking for a nice Italian restaurant for dinner"),
            ("assistant", "I'd be happy to help you find the perfect Italian restaurant! To give you the best recommendations, could you tell me:\n\n1. **Location preference** - Any particular neighborhood?\n2. **Party size** - How many guests?\n3. **Ambiance** - Casual, romantic, family-friendly?\n4. **Budget** - Any price preference?"),
        ]
    },
    {
        "title": "Making a Reservation",
        "messages": [
            ("user", "I want to book a table for 4 at Bella Notte Downtown for Saturday at 7pm"),
            ("assistant", "I'd love to help you book at Bella Notte - Downtown! Let me check availability for Saturday at 7:00 PM for 4 guests...\n\n✅ Great news! That time is available!\n\nTo complete your reservation, I'll need:\n- **Your name**\n- **Phone number**\n- Any special requests or occasion?"),
        ]
    },
]


if __name__ == "__main__":
    main()
