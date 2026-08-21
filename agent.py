"""
GoodFoods AI Reservation Agent
Implements tool-calling architecture with LLM inference
Built from scratch without LangChain or similar frameworks

The LLM backend is pluggable: Ollama (local), Google Gemini, or any
OpenAI-compatible API. See llm_providers.py for the provider contract.
"""
import json
import re
from typing import List, Dict, Any, Optional, Generator
from dataclasses import dataclass, field
from datetime import datetime

from config import DEBUG, MAX_HISTORY_MESSAGES
from llm_providers import LLMError, LLMProvider, create_provider
from prompts import get_system_prompt, get_intent_classification_prompt
from tools import execute_tool, get_tools_for_intents
from models import ToolResult


@dataclass
class Message:
    """Represents a conversation message"""
    role: str  # system, user, assistant, tool
    content: str
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None


@dataclass 
class ConversationState:
    """Tracks the state of a conversation"""
    messages: List[Message] = field(default_factory=list)
    selected_restaurant: Optional[Dict] = None
    collected_preferences: Dict = field(default_factory=dict)
    pending_reservation: Optional[Dict] = None
    last_tool_results: List[ToolResult] = field(default_factory=list)


class ReservationAgent:
    """
    AI-powered reservation agent using tool-calling architecture.
    Works with any backend registered in llm_providers.py
    (Ollama, Gemini, or an OpenAI-compatible API).
    """

    def __init__(self, model: str = None, provider: str = None):
        self.llm: LLMProvider = create_provider(provider=provider, model=model)
        self.provider = self.llm.name
        self.model = self.llm.model
        self.endpoint = self.llm.endpoint
        self.conversation = ConversationState()

        self._add_system_message()
    
    def _add_system_message(self):
        """Add the system prompt to conversation"""
        system_prompt = get_system_prompt()
        self.conversation.messages.append(Message(
            role="system",
            content=system_prompt
        ))
    
    def _format_messages_for_api(self) -> List[Dict]:
        """Format conversation messages for API call with history limiting.

        For history (older messages): Only include user messages and final assistant responses.
        Skip tool_calls and tool responses from past turns to reduce token usage.

        For current turn: Include tool_calls and tool responses so LLM can continue.
        """
        formatted = []

        system_msg = None
        non_system_messages = []

        for msg in self.conversation.messages:
            if msg.role == "system":
                system_msg = {"role": "system", "content": msg.content}
            else:
                non_system_messages.append(msg)

        if system_msg:
            formatted.append(system_msg)

        recent_messages = non_system_messages[-MAX_HISTORY_MESSAGES:]

        current_turn_start = -1
        for i in range(len(recent_messages) - 1, -1, -1):
            if recent_messages[i].role == "user":
                current_turn_start = i
                break

        for i, msg in enumerate(recent_messages):
            is_current_turn = i >= current_turn_start

            if msg.role == "user":
                formatted.append({"role": "user", "content": msg.content})

            elif msg.role == "assistant":
                if is_current_turn:
                    assistant_msg = {"role": "assistant"}
                    if msg.content:
                        assistant_msg["content"] = msg.content
                    if msg.tool_calls:
                        assistant_msg["tool_calls"] = msg.tool_calls
                    formatted.append(assistant_msg)
                else:
                    if msg.content:
                        formatted.append({"role": "assistant", "content": msg.content})

            elif msg.role == "tool" and is_current_turn:
                formatted.append({
                    "role": "tool",
                    "tool_call_id": msg.tool_call_id,
                    "name": msg.name,
                    "content": msg.content,
                })

        return formatted
    
    def _call_llm(self, messages: List[Dict], tools: Optional[List[Dict]] = None) -> Dict:
        """Send a request to the active LLM backend.

        The provider normalizes its own wire format into an OpenAI-style
        envelope, so everything downstream is backend-agnostic.
        """

        if DEBUG:
            print(f"\n[DEBUG] {self.llm.label} request")
            print(f"[DEBUG] Model: {self.llm.model}")
            print(f"[DEBUG] Messages: {len(messages)} | Tools: {len(tools) if tools else 0}")

        try:
            return self.llm.chat(messages, tools)
        except LLMError:
            raise
        except Exception as e:
            raise LLMError(
                f"Unexpected {self.llm.label} error: {type(e).__name__}: {e}"
            )
    
    def _parse_tool_calls(self, response: Dict) -> List[Dict]:
        """Extract tool calls from LLM response"""
        tool_calls = []
        
        if "choices" not in response or not response["choices"]:
            return tool_calls
        
        message = response["choices"][0].get("message", {})
        
        if "tool_calls" in message:
            for tc in message["tool_calls"]:
                func = tc.get("function", {})
                parsed_func = {
                    "name": func.get("name", ""),
                    "arguments": func.get("arguments", {})
                }
                for k, v in func.items():
                    if k not in ("name", "arguments"):
                        parsed_func[k] = v

                parsed_tc = {
                    "id": tc.get("id", f"call_{len(tool_calls)}"),
                    "type": "function",
                    "function": parsed_func
                }
                for k, v in tc.items():
                    if k not in ("id", "type", "function"):
                        parsed_tc[k] = v

                tool_calls.append(parsed_tc)
        
        return tool_calls
    
    def _execute_tool_calls(self, tool_calls: List[Dict]) -> List[ToolResult]:
        """Execute a list of tool calls and return results"""
        results = []
        
        for tc in tool_calls:
            func = tc["function"]
            tool_name = func["name"]
            
            try:
                if isinstance(func["arguments"], str):
                    arguments = json.loads(func["arguments"])
                else:
                    arguments = func["arguments"]
            except json.JSONDecodeError:
                arguments = {}
            
            if DEBUG:
                print(f"\n[DEBUG] Executing tool: {tool_name}")
            
            result = execute_tool(tool_name, arguments)
            result.tool_call_id = tc["id"]
            results.append(result)
            
            if DEBUG:
                print(f"[DEBUG] Result success: {result.success}")
        
        return results
    
    def _update_conversation_state(self, tool_results: List[ToolResult]):
        """Update conversation state based on tool results"""

        for result in tool_results:
            if not result.success or not result.data:
                continue

            if result.tool_name == "get_restaurant_details":
                self.conversation.selected_restaurant = result.data

            elif result.tool_name in ["search_restaurants", "get_recommendations"]:
                restaurants = result.data.get("restaurants") or result.data.get("recommendations", [])
                if len(restaurants) == 1:
                    self.conversation.selected_restaurant = restaurants[0]

            elif result.tool_name == "create_reservation":
                self.conversation.pending_reservation = None  # Clear pending

        self.conversation.last_tool_results = tool_results

    def _classify_intent(self, user_message: str) -> List[str]:
        """Classify the current message using the last three conversation turns."""
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in self.conversation.messages
            if msg.role in {"user", "assistant"} and msg.content
        ][-3:]
        classification_messages = [
            {"role": "system", "content": get_intent_classification_prompt()},
            *history,
            {"role": "user", "content": user_message},
        ]

        if DEBUG:
            print("\n[DEBUG] Stage 1: Classifying intent...")

        try:
            response = self._call_llm(classification_messages, tools=None)

            if "choices" in response and response["choices"]:
                raw_response = response["choices"][0].get("message", {}).get("content", "").strip().upper()

                valid_intents = ["SEARCH", "RESERVE", "MANAGE", "INFO", "GENERAL"]
                parsed_intents = []

                for part in raw_response.replace(" ", "").split(","):
                    if part in valid_intents:
                        parsed_intents.append(part)

                if parsed_intents:
                    if DEBUG:
                        print(f"[DEBUG] Classified intents: {parsed_intents}")
                    return parsed_intents

            if DEBUG:
                print("[DEBUG] Could not classify, defaulting to GENERAL")
            return ["GENERAL"]

        except Exception:
            if DEBUG:
                print("[DEBUG] Classification failed, defaulting to GENERAL")
            return ["GENERAL"]

    def _update_system_prompt(self, intents: List[str], tools: Optional[List[Dict]] = None):
        """Update the system message with intent-specific prompt and matching tool list"""
        new_system_prompt = get_system_prompt(intents=intents, tools=tools)

        for msg in self.conversation.messages:
            if msg.role == "system":
                msg.content = new_system_prompt
                break
    
    def chat(self, user_message: str) -> str:
        """
        Process a user message and return the agent's response.
        Two-stage approach:
        1. Classify intent(s) with minimal prompt
        2. Generate response with intent-specific prompt + filtered tools
        """

        intents = self._classify_intent(user_message)

        filtered_tools = get_tools_for_intents(intents)

        self._update_system_prompt(intents, tools=filtered_tools)

        if DEBUG:
            tool_names = [t["function"]["name"] for t in filtered_tools]
            print(f"[DEBUG] Stage 2: Generating response with intents={intents}")
            print(f"[DEBUG] Filtered tools ({len(filtered_tools)}): {tool_names}")

        self.conversation.messages.append(Message(
            role="user",
            content=user_message
        ))

        max_iterations = 5 
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            messages = self._format_messages_for_api()

            response = self._call_llm(messages, filtered_tools)
            
            if "choices" not in response or not response["choices"]:
                return "I'm sorry, I encountered an error processing your request."
            
            choice = response["choices"][0]
            message = choice.get("message", {})
            
            tool_calls = self._parse_tool_calls(response)
            
            if tool_calls:
                self.conversation.messages.append(Message(
                    role="assistant",
                    content=message.get("content", ""),
                    tool_calls=tool_calls
                ))
                
                results = self._execute_tool_calls(tool_calls)
                self._update_conversation_state(results)
                
                for tc, result in zip(tool_calls, results):
                    tool_content = json.dumps({
                        "success": result.success,
                        "data": result.data,
                        "error": result.error,
                    })
                    
                    self.conversation.messages.append(Message(
                        role="tool",
                        content=tool_content,
                        tool_call_id=tc["id"],
                        name=tc["function"]["name"]
                    ))
                
                continue
            
            else:
                assistant_content = message.get("content", "")
                
                self.conversation.messages.append(Message(
                    role="assistant",
                    content=assistant_content
                ))
                
                return assistant_content
        
        return "I apologize, but I'm having trouble processing your request. Please try again."

    def chat_stream(self, user_message: str):
        """
        Generator that yields SSE-compatible streaming events during execution:
        - {"type": "intent", "intents": [...]}
        - {"type": "tool_call", "name": ..., "arguments": ...}
        - {"type": "tool_result", "name": ..., "success": ..., "data": ...}
        - {"type": "token", "token": "..."}
        - {"type": "done", "response": "..."}
        """
        intents = self._classify_intent(user_message)
        yield {"type": "intent", "intents": intents}

        filtered_tools = get_tools_for_intents(intents)
        self._update_system_prompt(intents, tools=filtered_tools)

        self.conversation.messages.append(Message(
            role="user",
            content=user_message
        ))

        max_iterations = 5
        iteration = 0

        while iteration < max_iterations:
            iteration += 1
            messages = self._format_messages_for_api()
            response = self._call_llm(messages, filtered_tools)

            if "choices" not in response or not response["choices"]:
                err_msg = "I'm sorry, I encountered an error processing your request."
                yield {"type": "token", "token": err_msg}
                yield {"type": "done", "response": err_msg}
                return

            choice = response["choices"][0]
            message = choice.get("message", {})
            tool_calls = self._parse_tool_calls(response)

            if tool_calls:
                self.conversation.messages.append(Message(
                    role="assistant",
                    content=message.get("content", ""),
                    tool_calls=tool_calls
                ))

                for tc in tool_calls:
                    yield {
                        "type": "tool_call",
                        "name": tc["function"]["name"],
                        "arguments": tc["function"].get("arguments", {}),
                    }

                results = self._execute_tool_calls(tool_calls)
                self._update_conversation_state(results)

                for tc, result in zip(tool_calls, results):
                    yield {
                        "type": "tool_result",
                        "name": tc["function"]["name"],
                        "success": result.success,
                        "data": result.data,
                        "error": result.error,
                    }
                    tool_content = json.dumps({
                        "success": result.success,
                        "data": result.data,
                        "error": result.error,
                    })
                    self.conversation.messages.append(Message(
                        role="tool",
                        content=tool_content,
                        tool_call_id=tc["id"],
                        name=tc["function"]["name"]
                    ))
                continue
            else:
                assistant_content = message.get("content", "")
                self.conversation.messages.append(Message(
                    role="assistant",
                    content=assistant_content
                ))
                # Yield assistant response in small realistic token chunks
                words = assistant_content.split(" ")
                for i, word in enumerate(words):
                    chunk = word if i == len(words) - 1 else word + " "
                    yield {"type": "token", "token": chunk}

                yield {"type": "done", "response": assistant_content}
                return

        fallback = "I apologize, but I'm having trouble processing your request. Please try again."
        yield {"type": "token", "token": fallback}
        yield {"type": "done", "response": fallback}
    def reset_conversation(self):
        """Reset the conversation state"""
        self.conversation = ConversationState()
        self._add_system_message()
    
    def get_conversation_history(self) -> List[Dict]:
        """Get formatted conversation history for display"""
        history = []
        
        for msg in self.conversation.messages:
            if msg.role == "system":
                continue  # Skip system messages for display
            
            if msg.role in ["user", "assistant"]:
                history.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        return history


class MockReservationAgent(ReservationAgent):
    """
    Mock agent for testing without API calls.
    Uses simple pattern matching to simulate responses.
    """
    
    def __init__(self):
        self.llm = None
        self.provider = "mock"
        self.model = "mock"
        self.endpoint = None
        self.conversation = ConversationState()
        self._add_system_message()
    
    def _add_system_message(self):
        self.conversation.messages.append(Message(
            role="system",
            content=get_system_prompt()
        ))
    
    def chat(self, user_message: str) -> str:
        """Process message using pattern matching and direct tool calls"""
        
        self.conversation.messages.append(Message(
            role="user",
            content=user_message
        ))
        
        user_lower = user_message.lower()
        
        if any(word in user_lower for word in ["recommend", "suggestion", "suggest"]):
            result = execute_tool("get_recommendations", {
                "party_size": self._extract_party_size(user_message),
                "occasion": self._extract_occasion(user_message)
            })
            response = self._format_response("Here are my recommendations:", result)
        
        elif any(word in user_lower for word in ["search", "find", "looking for", "want"]):
            result = execute_tool("search_restaurants", {
                "cuisine": self._extract_cuisine(user_message),
                "neighborhood": self._extract_neighborhood(user_message)
            })
            response = self._format_response("Here's what I found:", result)
        
        elif any(word in user_lower for word in ["book", "reserve", "reservation", "table"]):
            if any(word in user_lower for word in ["cancel"]):
                code_match = re.search(r'\b(GF[A-Z0-9]{6}|RES\d{5})\b', user_message)
                if code_match:
                    result = execute_tool("cancel_reservation", {"confirmation_code": code_match.group(1)})
                    self.conversation.last_tool_results = [result]
                    response = result.display_text if result.display_text else ("Reservation cancelled." if result.success else "Could not cancel.")
                else:
                    response = "I'd be happy to help cancel your reservation. Could you please provide your confirmation code (e.g. GF123456)?"
            elif any(word in user_lower for word in ["modify", "change", "update"]):
                response = "I can help you modify your reservation. Please provide your confirmation code and what you'd like to change."
            else:
                party_size = self._extract_party_size(user_message) or 2
                rest_id = self._extract_restaurant_id(user_message)
                date_str = self._extract_date(user_message) or "2026-08-22"
                time_str = self._extract_time(user_message) or "19:00"
                name_str = self._extract_name(user_message) or "Guest"
                phone_str = self._extract_phone(user_message) or "555-0100"

                if "name:" in user_lower or "phone:" in user_lower or rest_id or "please book" in user_lower:
                    result = execute_tool("create_reservation", {
                        "restaurant_id": rest_id or "REST001",
                        "customer_name": name_str,
                        "customer_phone": phone_str,
                        "party_size": party_size,
                        "date": date_str,
                        "time": time_str,
                    })
                    self.conversation.last_tool_results = [result]
                    self._update_conversation_state([result])
                    response = result.display_text if result.display_text else ("Reservation confirmed!" if result.success else "Table not available for selected slot.")
                else:
                    response = "I'd love to help you make a reservation! Could you tell me:\n1. Which restaurant or type of cuisine you prefer?\n2. Date and time?\n3. Number of guests, name, and phone number?"
        elif any(word in user_lower for word in ["available", "availability", "open"]):
            response = "To check availability, please tell me:\n- Which restaurant (or type of cuisine)?\n- What date?\n- How many guests?"
        
        elif any(word in user_lower for word in ["cuisines", "types of food", "what kind"]):
            result = execute_tool("get_cuisine_types", {})
            response = result.display_text
        
        elif any(word in user_lower for word in ["neighborhood", "area", "location"]):
            result = execute_tool("get_neighborhoods", {})
            response = result.display_text
        
        elif any(word in user_lower for word in ["hi", "hello", "hey"]):
            response = """👋 Welcome to **GoodFoods AI Concierge**! 

I'm here to help you discover the perfect restaurant and make reservations across our 75 locations.

How can I assist you today?
- 🔍 **Find restaurants** by cuisine, location, or ambiance
- ⭐ **Get personalized recommendations** for your occasion
- 📅 **Make, modify, or cancel reservations**
- ℹ️ **Learn about specific restaurants**

Just tell me what you're looking for!"""
        
        else:
            response = """I'm here to help with your dining needs! I can:

• **Search** for restaurants by cuisine, location, or price
• **Recommend** the perfect spot for your occasion
• **Book** a table at any of our 75 locations
• **Manage** existing reservations

What would you like to do?"""
        
        self.conversation.messages.append(Message(
            role="assistant",
            content=response
        ))
        return response

    def chat_stream(self, user_message: str):
        """Simulate SSE streaming for MockAgent in tests or offline demo mode."""
        yield {"type": "intent", "intents": ["GENERAL"]}
        full_response = self.chat(user_message)
        words = full_response.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == len(words) - 1 else word + " "
            yield {"type": "token", "token": chunk}
        yield {"type": "done", "response": full_response}
    def _extract_restaurant_id(self, text: str) -> Optional[str]:
        """Extract or resolve restaurant ID from text"""
        from database import db
        text_lower = text.lower()
        for r in db.restaurants.values():
            if r.name.lower() in text_lower or (r.neighborhood.lower() in text_lower and any(c.value.lower() in text_lower for c in r.cuisine_types)):
                return r.id
        return None

    def _extract_date(self, text: str) -> Optional[str]:
        import re
        date_match = re.search(r'\b(20\d\d-\d\d-\d\d)\b', text)
        if date_match:
            return date_match.group(1)
        if "august 22" in text.lower() or "22nd august" in text.lower() or "aug 22" in text.lower():
            return "2026-08-22"
        if "tomorrow" in text.lower():
            return "2026-08-22"
        return "2026-08-22"

    def _extract_time(self, text: str) -> Optional[str]:
        import re
        time_match = re.search(r'\b(\d{1,2}):(\d{2})\b', text)
        if time_match:
            return f"{int(time_match.group(1)):02d}:{time_match.group(2)}"
        if "9 pm" in text.lower() or "9:00 pm" in text.lower() or "9pm" in text.lower():
            return "21:00"
        if "8 pm" in text.lower() or "8:00 pm" in text.lower() or "8pm" in text.lower():
            return "20:00"
        if "7 pm" in text.lower() or "7:00 pm" in text.lower() or "7pm" in text.lower():
            return "19:00"
        return "19:00"

    def _extract_name(self, text: str) -> Optional[str]:
        import re
        name_match = re.search(r'(?:name\s*(?:is|:)?\s*)([A-Za-z]+)', text, re.IGNORECASE)
        if name_match:
            return name_match.group(1).strip()
        return None

    def _extract_phone(self, text: str) -> Optional[str]:
        import re
        phone_match = re.search(r'\b(\d{3}[-\s]?\d{3}[-\s]?\d{4})\b', text)
        if phone_match:
            return phone_match.group(1).strip()
        return None

    def _extract_party_size(self, text: str) -> Optional[int]:
        """Extract party size from text"""
        import re
        numbers = re.findall(r'\b(?:for|party of)?\s*(\d+)\s*(?:people|guests|persons?|of us)?\b', text.lower())
        for n in numbers:
            if n.isdigit() and 1 <= int(n) <= 20:
                return int(n)
        return None
    def _extract_cuisine(self, text: str) -> Optional[str]:
        """Extract cuisine type from text"""
        cuisines = ["italian", "mexican", "japanese", "chinese", "indian", "thai", 
                   "korean", "vietnamese", "french", "american", "mediterranean",
                   "seafood", "steakhouse", "vegetarian", "fusion"]
        text_lower = text.lower()
        for cuisine in cuisines:
            if cuisine in text_lower:
                return cuisine.title()
        return None
    
    def _extract_neighborhood(self, text: str) -> Optional[str]:
        """Extract neighborhood from text"""
        from database import db
        neighborhoods = db.get_neighborhoods()
        text_lower = text.lower()
        for n in neighborhoods:
            if n.lower() in text_lower:
                return n
        return None
    
    def _extract_occasion(self, text: str) -> Optional[str]:
        """Extract occasion from text"""
        occasions = ["birthday", "anniversary", "date", "romantic", "business", 
                    "family", "celebration", "casual", "meeting"]
        text_lower = text.lower()
        for occ in occasions:
            if occ in text_lower:
                return occ
        return None
    
    def _format_response(self, intro: str, result: ToolResult) -> str:
        """Format a tool result into a response"""
        if result.display_text:
            return f"{intro}\n\n{result.display_text}"
        return intro


def create_agent(
    use_mock: bool = False, model: str = None, provider: str = None
) -> ReservationAgent:
    """Factory function to create an agent instance.

    Args:
        use_mock: skip the LLM entirely and use pattern matching.
        model: model id, e.g. "qwen2.5:7b" or "gemini-2.5-flash".
        provider: "ollama", "gemini" or "openai". Defaults to LLM_PROVIDER.
    """
    if use_mock:
        return MockReservationAgent()
    return ReservationAgent(model=model, provider=provider)
