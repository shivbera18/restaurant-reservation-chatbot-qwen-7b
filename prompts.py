"""
System prompts for the GoodFoods AI Reservation Agent
Two-stage approach: Intent classification + Modular prompts
"""
from datetime import datetime


INTENT_CLASSIFICATION_PROMPT = """Classify the user's intent. A message can have multiple intents.

Categories:
- SEARCH: Looking for restaurants, asking for recommendations, exploring options
- RESERVE: Wants to book a table, make a reservation
- MANAGE: Check, modify, or cancel an existing reservation
- INFO: Questions about a specific restaurant, hours, menu
- GENERAL: Greetings, general questions, unclear intent

Respond with comma-separated category names if multiple apply.
Examples:
- "Find me an Italian restaurant" -> SEARCH
- "Book a table for 4 at 7pm" -> RESERVE
- "Recommend a place and book it" -> SEARCH,RESERVE
- "Hello" -> GENERAL
- "Cancel my reservation" -> MANAGE

Respond with ONLY the category name(s), nothing else."""


def get_intent_classification_prompt() -> str:
    """Get the minimal prompt for intent classification"""
    return INTENT_CLASSIFICATION_PROMPT



def get_base_prompt() -> str:
    """Minimal base prompt - always included"""
    current_date = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now().strftime("%H:%M")

    return f"""You are the GoodFoods AI Concierge for our 75-restaurant chain.

Today: {current_date} | Time: {current_time}

Core Rules:
1. ALWAYS use tools for real data - never make up names, availability, or codes
2. Keep responses concise
3. Use restaurant ID when calling tools
4. ONLY pass parameters the user explicitly mentioned - never guess or add extra parameters"""


TOOL_DESCRIPTIONS = {
    "search_restaurants": "- search_restaurants: Find restaurants by cuisine, location, price",
    "get_recommendations": "- get_recommendations: Personalized suggestions for occasion/preferences",
    "get_restaurant_details": "- get_restaurant_details: Get specific restaurant info",
    "check_availability": "- check_availability: Check time slots before booking",
    "create_reservation": "- create_reservation: Book (needs: restaurant_id, date, time, party_size, name, phone)",
    "lookup_reservation": "- lookup_reservation: Find booking by confirmation code or phone",
    "modify_reservation": "- modify_reservation: Change existing booking",
    "cancel_reservation": "- cancel_reservation: Cancel booking",
    "get_faq": "- get_faq: Restaurant policy answers",
    "get_neighborhoods": "- get_neighborhoods: List available areas",
    "get_cuisine_types": "- get_cuisine_types: List cuisine options",
}


def get_tool_prompt(tools: list = None) -> str:
    """Tool usage instructions filtered to available tools"""
    if tools is None:
        lines = list(TOOL_DESCRIPTIONS.values())
    else:
        names = {
            t["function"]["name"]
            for t in tools
            if isinstance(t, dict) and "function" in t and "name" in t.get("function", {})
        }
        lines = [TOOL_DESCRIPTIONS[n] for n in names if n in TOOL_DESCRIPTIONS]

    if not lines:
        return ""
    return "Available Tools:\n" + "\n".join(lines)


def get_search_prompt() -> str:
    """Context for restaurant search/discovery"""
    return """For restaurant search:
- Ask about: cuisine, location, party size, date/time
- Consider occasion (date, business, family, celebration)
- Ask about special needs (dietary, accessibility, outdoor)
- Offer 3-5 recommendations with brief reasons"""


def get_reservation_prompt() -> str:
    """Context for making reservations"""
    return """For reservations:
- Confirm details before booking: restaurant, date, time, party size
- Required: customer name and phone number
- Ask about special requests or occasions
- Provide confirmation code clearly after booking"""


def get_management_prompt() -> str:
    """Context for managing existing reservations"""
    return """For reservation management:
- Ask for confirmation code or phone to look up
- Confirm changes before applying
- Be empathetic when handling cancellations"""


def get_info_prompt() -> str:
    """Context for restaurant information queries"""
    return """For restaurant info:
- Use get_restaurant_details tool to fetch accurate information
- Share hours, location, cuisine, price range, and amenities
- Mention popular dishes and special features"""


def get_general_prompt() -> str:
    """Context for general queries/greetings"""
    return """Introduce yourself briefly and offer to help with:
- Finding restaurants
- Making reservations
- Managing existing bookings"""


INTENT_PROMPTS = {
    "SEARCH": get_search_prompt,
    "RESERVE": get_reservation_prompt,
    "MANAGE": get_management_prompt,
    "INFO": get_info_prompt,
    "GENERAL": get_general_prompt,
}


def get_system_prompt(intents: list = None, include_tools: bool = True, tools: list = None) -> str:
    """
    Get modular system prompt based on classified intents.

    Args:
        intents: List of classified intents (SEARCH, RESERVE, MANAGE, INFO, GENERAL)
        include_tools: Whether to include tool descriptions
        tools: List of active tool definition dicts to include descriptions for

    Returns:
        Assembled system prompt with relevant modules
    """
    parts = [get_base_prompt()]

    if include_tools:
        tool_prompt = get_tool_prompt(tools=tools)
        if tool_prompt:
            parts.append(tool_prompt)

    added_prompts = set()
    if intents:
        for intent in intents:
            intent_upper = intent.upper()
            if intent_upper in INTENT_PROMPTS and intent_upper not in added_prompts:
                parts.append(INTENT_PROMPTS[intent_upper]())
                added_prompts.add(intent_upper)

    if not added_prompts:
        parts.append(get_general_prompt())

    return "\n\n".join(parts)
