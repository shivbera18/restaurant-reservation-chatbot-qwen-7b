import streamlit as st
from datetime import datetime, timedelta

st.set_page_config(
    page_title="GoodFoods AI Concierge",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded"
)

from agent import create_agent, ReservationAgent, MockReservationAgent
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


def initialize_session_state():
    if "messages" not in st.session_state:
        st.session_state.messages = []

    if "agent" not in st.session_state:
        try:
            st.session_state.agent = create_agent()
        except Exception as e:
            st.session_state.agent = create_agent(use_mock=True)


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

        if st.button("🔄 New Conversation", use_container_width=True):
            st.session_state.messages = []
            st.session_state.agent.reset_conversation()
            st.rerun()

        st.markdown("---")
        st.markdown("""
        <small>
        **GoodFoods AI Concierge** v1.0<br>
        Built with Streamlit + Llama 3.3<br>
        Tool-calling architecture (MCP-style)
        </small>
        """, unsafe_allow_html=True)


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
