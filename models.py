try:
    from pydantic import BaseModel, Field
    USING_PYDANTIC = True
except ImportError:
    from dataclasses import dataclass, field
    USING_PYDANTIC = False

    def Field(default=None, ge=None, le=None, **kwargs):
        if default is None and 'default_factory' in kwargs:
            return field(default_factory=kwargs['default_factory'])
        return field(default=default)

    class BaseModel:
        pass

from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum


class CuisineType(str, Enum):
    AMERICAN = "american"
    ITALIAN = "italian"
    MEXICAN = "mexican"
    CHINESE = "chinese"
    JAPANESE = "japanese"
    INDIAN = "indian"
    THAI = "thai"
    MEDITERRANEAN = "mediterranean"
    FRENCH = "french"
    KOREAN = "korean"
    VIETNAMESE = "vietnamese"
    SEAFOOD = "seafood"
    STEAKHOUSE = "steakhouse"
    VEGETARIAN = "vegetarian"
    FUSION = "fusion"


class PriceRange(str, Enum):
    BUDGET = "$"
    MODERATE = "$$"
    UPSCALE = "$$$"
    FINE_DINING = "$$$$"


class Ambiance(str, Enum):
    CASUAL = "casual"
    FAMILY_FRIENDLY = "family_friendly"
    ROMANTIC = "romantic"
    BUSINESS = "business"
    TRENDY = "trendy"
    COZY = "cozy"
    LIVELY = "lively"
    UPSCALE = "upscale"


class ReservationStatus(str, Enum):
    CONFIRMED = "confirmed"
    PENDING = "pending"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class Restaurant(BaseModel):
    id: str
    name: str
    address: str
    city: str
    neighborhood: str
    phone: str
    cuisine_types: List[CuisineType]
    price_range: PriceRange
    ambiance: List[Ambiance]
    rating: float = Field(ge=1.0, le=5.0)
    total_reviews: int
    seating_capacity: int
    has_private_dining: bool = False
    has_outdoor_seating: bool = False
    has_bar: bool = False
    wheelchair_accessible: bool = True
    parking_available: bool = False
    accepts_walkins: bool = True
    open_time: str = "11:00"
    close_time: str = "22:00"
    description: str
    popular_dishes: List[str]
    dietary_options: List[str] = []

    def to_display_string(self) -> str:
        cuisines = ", ".join([c.value for c in self.cuisine_types])
        ambiances = ", ".join([a.value for a in self.ambiance])
        features = []
        if self.has_private_dining:
            features.append("Private Dining")
        if self.has_outdoor_seating:
            features.append("Outdoor Seating")
        if self.has_bar:
            features.append("Full Bar")
        if self.parking_available:
            features.append("Parking")

        return f"""
**{self.name}** ({self.price_range.value})
📍 {self.address}, {self.neighborhood}
🍽️ {cuisines}
⭐ {self.rating}/5 ({self.total_reviews} reviews)
🎭 Ambiance: {ambiances}
⏰ Hours: {self.open_time} - {self.close_time}
👥 Capacity: {self.seating_capacity} seats
{"🌟 Features: " + ", ".join(features) if features else ""}
📝 {self.description}
""".strip()


class TimeSlot(BaseModel):
    time: str
    available_seats: int
    is_peak: bool = False


class Availability(BaseModel):
    restaurant_id: str
    date: str
    time_slots: List[TimeSlot]


class Reservation(BaseModel):
    id: str
    restaurant_id: str
    restaurant_name: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    party_size: int = Field(ge=1, le=20)
    date: str
    time: str
    special_requests: Optional[str] = None
    occasion: Optional[str] = None
    status: ReservationStatus = ReservationStatus.CONFIRMED
    created_at: datetime = Field(default_factory=datetime.now)
    confirmation_code: str

    def to_display_string(self) -> str:
        return f"""
📋 **Reservation Confirmed**
━━━━━━━━━━━━━━━━━━━━━━
🎫 Confirmation: **{self.confirmation_code}**
🍽️ Restaurant: {self.restaurant_name}
📅 Date: {self.date}
⏰ Time: {self.time}
👥 Party Size: {self.party_size}
👤 Name: {self.customer_name}
📞 Phone: {self.customer_phone}
{f"✨ Special Requests: {self.special_requests}" if self.special_requests else ""}
{f"🎉 Occasion: {self.occasion}" if self.occasion else ""}
━━━━━━━━━━━━━━━━━━━━━━
""".strip()


class CustomerPreferences(BaseModel):
    party_size: Optional[int] = None
    date: Optional[str] = None
    time: Optional[str] = None
    cuisine_preferences: List[CuisineType] = []
    price_range: Optional[PriceRange] = None
    ambiance_preferences: List[Ambiance] = []
    neighborhood: Optional[str] = None
    needs_wheelchair_access: bool = False
    needs_outdoor_seating: bool = False
    needs_private_dining: bool = False
    occasion: Optional[str] = None
    dietary_requirements: List[str] = []


class ToolCall(BaseModel):
    name: str
    arguments: dict


class ToolResult(BaseModel):
    tool_name: str
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    display_text: Optional[str] = None
    tool_call_id: Optional[str] = None
