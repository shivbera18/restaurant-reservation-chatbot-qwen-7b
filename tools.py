import json
from typing import Any, Dict, List, Optional, Callable
from datetime import datetime, timedelta
from models import ToolResult, CustomerPreferences, CuisineType, PriceRange, Ambiance
from database import db


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_restaurants",
            "description": "Search for restaurants based on various criteria like cuisine type, price range, neighborhood, ambiance, etc. Use this when the user wants to find restaurants matching their preferences.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cuisine": {
                        "type": "string",
                        "enum": ["american", "italian", "mexican", "chinese", "japanese", "indian", "thai", "mediterranean", "french", "korean", "vietnamese", "seafood", "steakhouse", "vegetarian", "fusion"],
                        "description": "Type of cuisine"
                    },
                    "price_range": {
                        "type": "string",
                        "enum": ["$", "$$", "$$$", "$$$$", "budget", "moderate", "upscale", "fine_dining"],
                        "description": "Price range: $ (budget), $$ (moderate), $$$ (upscale), $$$$ (fine dining)"
                    },
                    "neighborhood": {
                        "type": "string",
                        "description": "Neighborhood or area (e.g., Downtown, Midtown, Westside, Waterfront)"
                    },
                    "min_rating": {
                        "type": "number",
                        "description": "Minimum rating (1-5)"
                    },
                    "party_size": {
                        "type": "integer",
                        "description": "Number of guests in the party"
                    },
                    "ambiance": {
                        "type": "string",
                        "enum": ["casual", "family_friendly", "romantic", "business", "trendy", "cozy", "lively", "upscale"],
                        "description": "Desired ambiance or atmosphere"
                    },
                    "needs_wheelchair_access": {
                        "type": "boolean",
                        "description": "Whether wheelchair accessibility is required"
                    },
                    "needs_outdoor_seating": {
                        "type": "boolean",
                        "description": "Whether outdoor seating is required"
                    },
                    "needs_private_dining": {
                        "type": "boolean",
                        "description": "Whether private dining room is required"
                    },
                    "dietary_requirement": {
                        "type": "string",
                        "description": "Dietary requirements (e.g., vegetarian, vegan, gluten-free)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommendations",
            "description": "Get personalized restaurant recommendations based on customer preferences. Use this when the user wants suggestions or recommendations rather than a specific search.",
            "parameters": {
                "type": "object",
                "properties": {
                    "party_size": {
                        "type": "integer",
                        "description": "Number of guests"
                    },
                    "cuisine_preferences": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": ["american", "italian", "mexican", "chinese", "japanese", "indian", "thai", "mediterranean", "french", "korean", "vietnamese", "seafood", "steakhouse", "vegetarian", "fusion"]
                        },
                        "description": "List of preferred cuisine types"
                    },
                    "price_range": {
                        "type": "string",
                        "enum": ["$", "$$", "$$$", "$$$$", "budget", "moderate", "upscale", "fine_dining"],
                        "description": "Preferred price range"
                    },
                    "ambiance_preferences": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": ["casual", "family_friendly", "romantic", "business", "trendy", "cozy", "lively", "upscale"]
                        },
                        "description": "List of preferred ambiances"
                    },
                    "neighborhood": {
                        "type": "string",
                        "description": "Preferred neighborhood"
                    },
                    "occasion": {
                        "type": "string",
                        "description": "Special occasion (e.g., birthday, anniversary, business dinner, date night)"
                    },
                    "dietary_requirements": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of dietary requirements"
                    },
                    "needs_wheelchair_access": {
                        "type": "boolean",
                        "description": "Whether wheelchair accessibility is required"
                    },
                    "needs_outdoor_seating": {
                        "type": "boolean",
                        "description": "Whether outdoor seating is preferred"
                    },
                    "needs_private_dining": {
                        "type": "boolean",
                        "description": "Whether private dining is needed"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_restaurant_details",
            "description": "Get detailed information about a specific restaurant by its ID or name. Use this when the user asks about a specific restaurant.",
            "parameters": {
                "type": "object",
                "properties": {
                    "restaurant_id": {
                        "type": "string",
                        "description": "The restaurant ID (e.g., REST001)"
                    },
                    "restaurant_name": {
                        "type": "string",
                        "description": "The restaurant name to search for"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": "Check available time slots for a restaurant on a specific date. Use this when the user wants to know when a restaurant has openings.",
            "parameters": {
                "type": "object",
                "properties": {
                    "restaurant_id": {
                        "type": "string",
                        "description": "The restaurant ID"
                    },
                    "date": {
                        "type": "string",
                        "description": "The date to check (format: YYYY-MM-DD)"
                    },
                    "party_size": {
                        "type": "integer",
                        "description": "Number of guests",
                        "default": 2
                    }
                },
                "required": ["restaurant_id", "date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_reservation",
            "description": "Create a new restaurant reservation. Use this when the user wants to book a table and has provided all necessary details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "restaurant_id": {
                        "type": "string",
                        "description": "The restaurant ID"
                    },
                    "customer_name": {
                        "type": "string",
                        "description": "Guest's full name"
                    },
                    "customer_phone": {
                        "type": "string",
                        "description": "Guest's phone number"
                    },
                    "customer_email": {
                        "type": ["string", "null"],
                        "description": "Guest's email address (optional)"
                    },
                    "party_size": {
                        "type": "integer",
                        "description": "Number of guests"
                    },
                    "date": {
                        "type": "string",
                        "description": "Reservation date (format: YYYY-MM-DD)"
                    },
                    "time": {
                        "type": "string",
                        "description": "Reservation time (format: HH:MM)"
                    },
                    "special_requests": {
                        "type": ["string", "null"],
                        "description": "Any special requests or notes (optional)"
                    },
                    "occasion": {
                        "type": ["string", "null"],
                        "description": "Special occasion (birthday, anniversary, etc., optional)"
                    }
                },
                "required": ["restaurant_id", "customer_name", "customer_phone", "party_size", "date", "time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "lookup_reservation",
            "description": "Look up an existing reservation by confirmation code or phone number. Use this when the user wants to view, modify, or cancel their reservation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "confirmation_code": {
                        "type": "string",
                        "description": "The reservation confirmation code (e.g., GF123ABC)"
                    },
                    "phone_number": {
                        "type": "string",
                        "description": "The phone number used for the reservation"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "modify_reservation",
            "description": "Modify an existing reservation. Use this when the user wants to change their reservation details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "confirmation_code": {
                        "type": "string",
                        "description": "The reservation confirmation code"
                    },
                    "new_date": {
                        "type": "string",
                        "description": "New date (format: YYYY-MM-DD)"
                    },
                    "new_time": {
                        "type": "string",
                        "description": "New time (format: HH:MM)"
                    },
                    "new_party_size": {
                        "type": "integer",
                        "description": "New party size"
                    },
                    "new_special_requests": {
                        "type": ["string", "null"],
                        "description": "Updated special requests (optional)"
                    }
                },
                "required": ["confirmation_code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_reservation",
            "description": "Cancel an existing reservation. Use this when the user wants to cancel their booking.",
            "parameters": {
                "type": "object",
                "properties": {
                    "confirmation_code": {
                        "type": "string",
                        "description": "The reservation confirmation code"
                    }
                },
                "required": ["confirmation_code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_neighborhoods",
            "description": "Get a list of all available neighborhoods/areas. Use this when the user asks about available locations or areas.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_cuisine_types",
            "description": "Get a list of all available cuisine types. Use this when the user asks what kinds of food are available.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]


class ToolExecutor:

    def __init__(self):
        self.tool_handlers: Dict[str, Callable] = {
            "search_restaurants": self._search_restaurants,
            "get_recommendations": self._get_recommendations,
            "get_restaurant_details": self._get_restaurant_details,
            "check_availability": self._check_availability,
            "create_reservation": self._create_reservation,
            "lookup_reservation": self._lookup_reservation,
            "modify_reservation": self._modify_reservation,
            "cancel_reservation": self._cancel_reservation,
            "get_neighborhoods": self._get_neighborhoods,
            "get_cuisine_types": self._get_cuisine_types,
        }

    def execute(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        handler = self.tool_handlers.get(tool_name)
        if not handler:
            return ToolResult(
                tool_name=tool_name,
                success=False,
                error=f"Unknown tool: {tool_name}"
            )

        try:
            return handler(**arguments)
        except Exception as e:
            return ToolResult(
                tool_name=tool_name,
                success=False,
                error=str(e)
            )

    def _search_restaurants(
        self,
        cuisine: Optional[str] = None,
        price_range: Optional[str] = None,
        neighborhood: Optional[str] = None,
        min_rating: Optional[float] = None,
        party_size: Optional[int] = None,
        ambiance: Optional[str] = None,
        needs_wheelchair_access: bool = False,
        needs_outdoor_seating: bool = False,
        needs_private_dining: bool = False,
        dietary_requirement: Optional[str] = None
    ) -> ToolResult:
        results = db.search_restaurants(
            cuisine=cuisine,
            price_range=price_range,
            neighborhood=neighborhood,
            min_rating=min_rating,
            party_size=party_size,
            ambiance=ambiance,
            needs_wheelchair_access=needs_wheelchair_access,
            needs_outdoor_seating=needs_outdoor_seating,
            needs_private_dining=needs_private_dining,
            dietary_requirement=dietary_requirement
        )

        if not results:
            return ToolResult(
                tool_name="search_restaurants",
                success=True,
                data={"restaurants": [], "count": 0},
                display_text="No restaurants found matching your criteria. Try adjusting your filters."
            )

        top_results = results[:10]

        display_lines = [f"Found {len(results)} restaurants. Here are the top matches:\n"]
        for i, r in enumerate(top_results, 1):
            cuisines = ", ".join([c.value for c in r.cuisine_types])
            display_lines.append(
                f"{i}. **{r.name}** ({r.price_range.value}) - {cuisines}\n"
                f"   📍 {r.neighborhood} | ⭐ {r.rating}/5 | 👥 Capacity: {r.seating_capacity}\n"
            )

        return ToolResult(
            tool_name="search_restaurants",
            success=True,
            data={
                "restaurants": [
                    {
                        "id": r.id,
                        "name": r.name,
                        "cuisines": [c.value for c in r.cuisine_types],
                        "price_range": r.price_range.value,
                        "neighborhood": r.neighborhood,
                        "rating": r.rating,
                        "capacity": r.seating_capacity
                    }
                    for r in top_results
                ],
                "count": len(results),
                "showing": len(top_results)
            },
            display_text="\n".join(display_lines)
        )

    def _get_recommendations(
        self,
        party_size: Optional[int] = None,
        cuisine_preferences: Optional[List[str]] = None,
        price_range: Optional[str] = None,
        ambiance_preferences: Optional[List[str]] = None,
        neighborhood: Optional[str] = None,
        occasion: Optional[str] = None,
        dietary_requirements: Optional[List[str]] = None,
        needs_wheelchair_access: bool = False,
        needs_outdoor_seating: bool = False,
        needs_private_dining: bool = False
    ) -> ToolResult:

        cuisine_enums = []
        if cuisine_preferences:
            for c in cuisine_preferences:
                try:
                    cuisine_enums.append(CuisineType(c))
                except ValueError:
                    for ct in CuisineType:
                        if c.lower() in ct.value.lower():
                            cuisine_enums.append(ct)
                            break

        price_enum = None
        if price_range:
            price_map = {"$": PriceRange.BUDGET, "$$": PriceRange.MODERATE,
                        "$$$": PriceRange.UPSCALE, "$$$$": PriceRange.FINE_DINING,
                        "budget": PriceRange.BUDGET, "moderate": PriceRange.MODERATE,
                        "upscale": PriceRange.UPSCALE, "fine_dining": PriceRange.FINE_DINING}
            price_enum = price_map.get(price_range.lower().replace(" ", "_"))

        ambiance_enums = []
        if ambiance_preferences:
            for a in ambiance_preferences:
                try:
                    ambiance_enums.append(Ambiance(a))
                except ValueError:
                    for amb in Ambiance:
                        if a.lower().replace("-", "_").replace(" ", "_") in amb.value.lower().replace("-", "_").replace(" ", "_"):
                            ambiance_enums.append(amb)
                            break

        prefs = CustomerPreferences(
            party_size=party_size,
            cuisine_preferences=cuisine_enums,
            price_range=price_enum,
            ambiance_preferences=ambiance_enums,
            neighborhood=neighborhood,
            occasion=occasion,
            dietary_requirements=dietary_requirements or [],
            needs_wheelchair_access=needs_wheelchair_access,
            needs_outdoor_seating=needs_outdoor_seating,
            needs_private_dining=needs_private_dining
        )

        results = db.get_recommendations(prefs, limit=5)

        if not results:
            return ToolResult(
                tool_name="get_recommendations",
                success=True,
                data={"recommendations": []},
                display_text="I couldn't find restaurants matching all your preferences. Let me search with fewer filters."
            )

        display_lines = ["Based on your preferences, here are my top recommendations:\n"]
        for i, r in enumerate(results, 1):
            cuisines = ", ".join([c.value for c in r.cuisine_types])
            ambiances = ", ".join([a.value for a in r.ambiance])
            features = []
            if r.has_private_dining:
                features.append("Private Dining")
            if r.has_outdoor_seating:
                features.append("Outdoor Seating")
            if r.has_bar:
                features.append("Full Bar")

            display_lines.append(
                f"**{i}. {r.name}** ({r.price_range.value})\n"
                f"   🍽️ {cuisines}\n"
                f"   📍 {r.neighborhood} | ⭐ {r.rating}/5\n"
                f"   🎭 {ambiances}\n"
                f"   {('✨ ' + ', '.join(features)) if features else ''}\n"
                f"   📝 {r.description}\n"
            )

        return ToolResult(
            tool_name="get_recommendations",
            success=True,
            data={
                "recommendations": [
                    {
                        "id": r.id,
                        "name": r.name,
                        "cuisines": [c.value for c in r.cuisine_types],
                        "price_range": r.price_range.value,
                        "neighborhood": r.neighborhood,
                        "rating": r.rating,
                        "description": r.description,
                        "ambiance": [a.value for a in r.ambiance]
                    }
                    for r in results
                ]
            },
            display_text="\n".join(display_lines)
        )

    def _get_restaurant_details(
        self,
        restaurant_id: Optional[str] = None,
        restaurant_name: Optional[str] = None
    ) -> ToolResult:
        restaurant = None

        if restaurant_id:
            restaurant = db.get_restaurant_by_id(restaurant_id)

        if not restaurant and restaurant_name:
            all_restaurants = db.get_all_restaurants()
            name_lower = restaurant_name.lower()
            for r in all_restaurants:
                if name_lower in r.name.lower():
                    restaurant = r
                    break

        if not restaurant:
            return ToolResult(
                tool_name="get_restaurant_details",
                success=False,
                error="Restaurant not found. Please check the ID or name."
            )

        return ToolResult(
            tool_name="get_restaurant_details",
            success=True,
            data={
                "id": restaurant.id,
                "name": restaurant.name,
                "address": restaurant.address,
                "city": restaurant.city,
                "neighborhood": restaurant.neighborhood,
                "phone": restaurant.phone,
                "cuisines": [c.value for c in restaurant.cuisine_types],
                "price_range": restaurant.price_range.value,
                "ambiance": [a.value for a in restaurant.ambiance],
                "rating": restaurant.rating,
                "reviews": restaurant.total_reviews,
                "capacity": restaurant.seating_capacity,
                "hours": f"{restaurant.open_time} - {restaurant.close_time}",
                "features": {
                    "private_dining": restaurant.has_private_dining,
                    "outdoor_seating": restaurant.has_outdoor_seating,
                    "bar": restaurant.has_bar,
                    "wheelchair_accessible": restaurant.wheelchair_accessible,
                    "parking": restaurant.parking_available
                },
                "popular_dishes": restaurant.popular_dishes,
                "dietary_options": restaurant.dietary_options,
                "description": restaurant.description
            },
            display_text=restaurant.to_display_string()
        )

    def _check_availability(
        self,
        restaurant_id: str,
        date: str,
        party_size: int = 2
    ) -> ToolResult:
        restaurant = db.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            return ToolResult(
                tool_name="check_availability",
                success=False,
                error="Restaurant not found."
            )

        availability = db.get_availability(restaurant_id, date, party_size)

        if not availability or not availability.time_slots:
            return ToolResult(
                tool_name="check_availability",
                success=True,
                data={"available_times": []},
                display_text=f"Sorry, no availability at {restaurant.name} on {date} for {party_size} guests."
            )

        lunch_slots = [s for s in availability.time_slots if int(s.time.split(":")[0]) < 15]
        dinner_slots = [s for s in availability.time_slots if int(s.time.split(":")[0]) >= 15]

        display_lines = [
            f"**Availability at {restaurant.name}**",
            f"📅 Date: {date} | 👥 Party: {party_size}\n"
        ]

        if lunch_slots:
            times = ", ".join([s.time for s in lunch_slots[:6]])
            display_lines.append(f"🌅 **Lunch:** {times}")

        if dinner_slots:
            times = ", ".join([s.time for s in dinner_slots[:8]])
            display_lines.append(f"🌙 **Dinner:** {times}")

        return ToolResult(
            tool_name="check_availability",
            success=True,
            data={
                "restaurant_id": restaurant_id,
                "restaurant_name": restaurant.name,
                "date": date,
                "party_size": party_size,
                "available_times": [
                    {"time": s.time, "available_seats": s.available_seats, "is_peak": s.is_peak}
                    for s in availability.time_slots
                ]
            },
            display_text="\n".join(display_lines)
        )

    def _create_reservation(
        self,
        restaurant_id: str,
        customer_name: str,
        customer_phone: str,
        party_size: int,
        date: str,
        time: str,
        customer_email: Optional[str] = None,
        special_requests: Optional[str] = None,
        occasion: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> ToolResult:
        reservation = db.create_reservation(
            restaurant_id=restaurant_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            party_size=party_size,
            date_str=date,
            time_str=time,
            special_requests=special_requests,
            occasion=occasion,
            user_id=user_id
        )

        if not reservation:
            return ToolResult(
                tool_name="create_reservation",
                success=False,
                error="Unable to create reservation. The selected time may no longer be available."
            )

        return ToolResult(
            tool_name="create_reservation",
            success=True,
            data={
                "confirmation_code": reservation.confirmation_code,
                "restaurant_name": reservation.restaurant_name,
                "date": reservation.date,
                "time": reservation.time,
                "party_size": reservation.party_size,
                "customer_name": reservation.customer_name
            },
            display_text=reservation.to_display_string()
        )

    def _lookup_reservation(
        self,
        confirmation_code: Optional[str] = None,
        phone_number: Optional[str] = None
    ) -> ToolResult:
        reservations = []

        if confirmation_code:
            res = db.get_reservation_by_code(confirmation_code)
            if res:
                reservations = [res]
        elif phone_number:
            reservations = db.get_reservation_by_phone(phone_number)

        if not reservations:
            return ToolResult(
                tool_name="lookup_reservation",
                success=True,
                data={"reservations": []},
                display_text="No reservations found with that information."
            )

        display_lines = []
        for res in reservations:
            display_lines.append(res.to_display_string())

        return ToolResult(
            tool_name="lookup_reservation",
            success=True,
            data={
                "reservations": [
                    {
                        "confirmation_code": r.confirmation_code,
                        "restaurant_name": r.restaurant_name,
                        "date": r.date,
                        "time": r.time,
                        "party_size": r.party_size,
                        "status": r.status.value
                    }
                    for r in reservations
                ]
            },
            display_text="\n\n".join(display_lines)
        )

    def _modify_reservation(
        self,
        confirmation_code: str,
        new_date: Optional[str] = None,
        new_time: Optional[str] = None,
        new_party_size: Optional[int] = None,
        new_special_requests: Optional[str] = None
    ) -> ToolResult:
        reservation = db.modify_reservation(
            confirmation_code=confirmation_code,
            new_date=new_date,
            new_time=new_time,
            new_party_size=new_party_size,
            new_special_requests=new_special_requests
        )

        if not reservation:
            return ToolResult(
                tool_name="modify_reservation",
                success=False,
                error="Unable to modify reservation. The reservation may not exist or the new time may be unavailable."
            )

        return ToolResult(
            tool_name="modify_reservation",
            success=True,
            data={
                "confirmation_code": reservation.confirmation_code,
                "restaurant_name": reservation.restaurant_name,
                "date": reservation.date,
                "time": reservation.time,
                "party_size": reservation.party_size
            },
            display_text=f"✅ **Reservation Updated**\n\n{reservation.to_display_string()}"
        )

    def _cancel_reservation(self, confirmation_code: str) -> ToolResult:
        reservation = db.cancel_reservation(confirmation_code)

        if not reservation:
            return ToolResult(
                tool_name="cancel_reservation",
                success=False,
                error="Reservation not found."
            )

        return ToolResult(
            tool_name="cancel_reservation",
            success=True,
            data={"confirmation_code": confirmation_code, "status": "cancelled"},
            display_text=f"✅ Your reservation at **{reservation.restaurant_name}** for {reservation.date} at {reservation.time} has been cancelled.\n\nWe hope to see you again soon!"
        )

    def _get_neighborhoods(self) -> ToolResult:
        neighborhoods = db.get_neighborhoods()

        return ToolResult(
            tool_name="get_neighborhoods",
            success=True,
            data={"neighborhoods": sorted(neighborhoods)},
            display_text="**Available Neighborhoods:**\n" + ", ".join(sorted(neighborhoods))
        )

    def _get_cuisine_types(self) -> ToolResult:
        cuisines = db.get_cuisine_types()

        return ToolResult(
            tool_name="get_cuisine_types",
            success=True,
            data={"cuisines": cuisines},
            display_text="**Available Cuisines:**\n" + ", ".join(cuisines)
        )


tool_executor = ToolExecutor()


INTENT_TOOLS = {
    "SEARCH": ["search_restaurants", "get_recommendations", "get_restaurant_details", "get_neighborhoods", "get_cuisine_types"],
    "RESERVE": ["check_availability", "create_reservation", "get_restaurant_details", "search_restaurants", "get_recommendations"],
    "MANAGE": ["lookup_reservation", "modify_reservation", "cancel_reservation"],
    "INFO": ["get_restaurant_details", "get_neighborhoods", "get_cuisine_types"],
    "GENERAL": ["get_neighborhoods", "get_cuisine_types"],
}


def get_tool_definitions() -> List[Dict]:
    return TOOL_DEFINITIONS


def get_tools_for_intents(intents: List[str]) -> List[Dict]:
    """
    Get tool definitions filtered by intents.
    Accepts a list of intents and returns union of all tools for those intents.
    """
    if not intents:
        return TOOL_DEFINITIONS

    tool_names = set()
    for intent in intents:
        intent_upper = intent.upper()
        if intent_upper in INTENT_TOOLS:
            tool_names.update(INTENT_TOOLS[intent_upper])

    if not tool_names:
        return TOOL_DEFINITIONS

    return [
        tool for tool in TOOL_DEFINITIONS
        if tool["function"]["name"] in tool_names
    ]


def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
    return tool_executor.execute(tool_name, arguments)
