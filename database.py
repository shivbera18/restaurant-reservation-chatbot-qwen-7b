"""
Database layer for GoodFoods Reservation System
Contains 75 diverse restaurant locations and reservation management
"""
import random
import secrets
import string
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict
from models import (
    Restaurant, CuisineType, PriceRange, Ambiance,
    Reservation, ReservationStatus, TimeSlot, Availability,
    CustomerPreferences
)
from neon_db import neon_db


class RestaurantDatabase:
    """In-memory database of GoodFoods restaurant locations"""
    
    def __init__(self):
        self.restaurants: Dict[str, Restaurant] = {}
        self.reservations: Dict[str, Reservation] = {}
        self._seed_restaurants()
        if neon_db.enabled:
            neon_db.migrate()
            self._load_or_seed_restaurants()
            self._load_reservations()
    
    def _seed_restaurants(self):
        """Populate database with 75 diverse restaurant locations."""
        random.seed(42)
        
        # Define neighborhoods
        neighborhoods = [
            ("Downtown", "123 Main St"),
            ("Midtown", "456 Central Ave"),
            ("Uptown", "789 Park Blvd"),
            ("Westside", "321 Ocean Dr"),
            ("Eastside", "654 Riverside Rd"),
            ("Arts District", "987 Gallery Way"),
            ("Financial District", "111 Commerce St"),
            ("Old Town", "222 Heritage Ln"),
            ("Harbor District", "333 Marina Way"),
            ("University Village", "444 Campus Dr"),
            ("Tech Hub", "555 Innovation Pkwy"),
            ("Garden District", "666 Bloom Ave"),
            ("Waterfront", "777 Bay View Terrace"),
            ("Historic Quarter", "888 Colonial Rd"),
            ("Entertainment District", "999 Theater Row")
        ]
        
        # Restaurant templates with variety
        restaurant_configs = [
            # Italian restaurants
            {"name": "Bella Notte", "cuisines": [CuisineType.ITALIAN], "price": PriceRange.UPSCALE,
             "ambiance": [Ambiance.ROMANTIC, Ambiance.UPSCALE], "desc": "Authentic Northern Italian cuisine with handmade pasta",
             "dishes": ["Truffle Risotto", "Osso Buco", "Tiramisu"], "dietary": ["vegetarian", "gluten-free options"]},
            {"name": "Trattoria Roma", "cuisines": [CuisineType.ITALIAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.FAMILY_FRIENDLY, Ambiance.COZY], "desc": "Classic Roman dishes in a warm, family atmosphere",
             "dishes": ["Cacio e Pepe", "Carbonara", "Cannoli"], "dietary": ["vegetarian"]},
            {"name": "Pizzeria Napoli", "cuisines": [CuisineType.ITALIAN], "price": PriceRange.BUDGET,
             "ambiance": [Ambiance.CASUAL, Ambiance.LIVELY], "desc": "Wood-fired Neapolitan pizzas and Italian street food",
             "dishes": ["Margherita Pizza", "Calzone", "Gelato"], "dietary": ["vegetarian", "vegan options"]},
            
            # Mexican restaurants
            {"name": "Casa del Sol", "cuisines": [CuisineType.MEXICAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.LIVELY, Ambiance.FAMILY_FRIENDLY], "desc": "Vibrant Mexican cantina with fresh margaritas",
             "dishes": ["Street Tacos", "Guacamole", "Churros"], "dietary": ["vegetarian", "vegan options", "gluten-free"]},
            {"name": "El Jardín", "cuisines": [CuisineType.MEXICAN], "price": PriceRange.UPSCALE,
             "ambiance": [Ambiance.TRENDY, Ambiance.ROMANTIC], "desc": "Modern Mexican cuisine with artisanal mezcal bar",
             "dishes": ["Mole Negro", "Ceviche", "Tres Leches"], "dietary": ["vegetarian", "gluten-free options"]},
            {"name": "Taqueria Auténtica", "cuisines": [CuisineType.MEXICAN], "price": PriceRange.BUDGET,
             "ambiance": [Ambiance.CASUAL], "desc": "Authentic street-style tacos and burritos",
             "dishes": ["Al Pastor Tacos", "Birria", "Horchata"], "dietary": ["gluten-free"]},
            
            # Asian restaurants
            {"name": "Jade Dragon", "cuisines": [CuisineType.CHINESE], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.FAMILY_FRIENDLY, Ambiance.BUSINESS], "desc": "Traditional Cantonese and Szechuan specialties",
             "dishes": ["Peking Duck", "Kung Pao Chicken", "Dim Sum"], "dietary": ["vegetarian options"]},
            {"name": "Sakura House", "cuisines": [CuisineType.JAPANESE], "price": PriceRange.UPSCALE,
             "ambiance": [Ambiance.TRENDY, Ambiance.ROMANTIC], "desc": "Premium omakase and sake pairings",
             "dishes": ["Omakase", "Wagyu Beef", "Uni"], "dietary": ["gluten-free options"]},
            {"name": "Tokyo Express", "cuisines": [CuisineType.JAPANESE], "price": PriceRange.BUDGET,
             "ambiance": [Ambiance.CASUAL, Ambiance.LIVELY], "desc": "Quick-service Japanese with fresh sushi rolls",
             "dishes": ["California Roll", "Teriyaki Bowl", "Miso Soup"], "dietary": ["vegetarian options", "gluten-free"]},
            {"name": "Spice of India", "cuisines": [CuisineType.INDIAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.COZY, Ambiance.FAMILY_FRIENDLY], "desc": "Rich curries and tandoori specialties from the subcontinent",
             "dishes": ["Butter Chicken", "Lamb Biryani", "Naan"], "dietary": ["vegetarian", "vegan options", "gluten-free"]},
            {"name": "Thai Orchid", "cuisines": [CuisineType.THAI], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.COZY, Ambiance.ROMANTIC], "desc": "Authentic Thai flavors with fresh ingredients",
             "dishes": ["Pad Thai", "Green Curry", "Mango Sticky Rice"], "dietary": ["vegetarian", "vegan options", "gluten-free"]},
            {"name": "Seoul Kitchen", "cuisines": [CuisineType.KOREAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.LIVELY, Ambiance.TRENDY], "desc": "Korean BBQ and traditional banchan",
             "dishes": ["Korean BBQ", "Bibimbap", "Kimchi Jjigae"], "dietary": ["gluten-free options"]},
            {"name": "Pho Saigon", "cuisines": [CuisineType.VIETNAMESE], "price": PriceRange.BUDGET,
             "ambiance": [Ambiance.CASUAL, Ambiance.FAMILY_FRIENDLY], "desc": "Steaming bowls of pho and fresh spring rolls",
             "dishes": ["Pho", "Banh Mi", "Spring Rolls"], "dietary": ["gluten-free options"]},
            
            # American restaurants
            {"name": "The Grill House", "cuisines": [CuisineType.AMERICAN, CuisineType.STEAKHOUSE], "price": PriceRange.UPSCALE,
             "ambiance": [Ambiance.BUSINESS, Ambiance.UPSCALE], "desc": "Prime cuts and classic American steakhouse experience",
             "dishes": ["Ribeye Steak", "Lobster Tail", "Creamed Spinach"], "dietary": ["gluten-free"]},
            {"name": "Burger & Brew", "cuisines": [CuisineType.AMERICAN], "price": PriceRange.BUDGET,
             "ambiance": [Ambiance.CASUAL, Ambiance.LIVELY], "desc": "Gourmet burgers and craft beer selection",
             "dishes": ["Classic Burger", "Truffle Fries", "Milkshakes"], "dietary": ["vegetarian options"]},
            {"name": "The Farmhouse", "cuisines": [CuisineType.AMERICAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.COZY, Ambiance.FAMILY_FRIENDLY], "desc": "Farm-to-table American comfort food",
             "dishes": ["Fried Chicken", "Mac & Cheese", "Apple Pie"], "dietary": ["vegetarian options", "gluten-free options"]},
            
            # Mediterranean & French
            {"name": "Olive & Vine", "cuisines": [CuisineType.MEDITERRANEAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.ROMANTIC, Ambiance.COZY], "desc": "Mediterranean mezze and grilled specialties",
             "dishes": ["Hummus Platter", "Lamb Kebabs", "Baklava"], "dietary": ["vegetarian", "vegan options", "gluten-free"]},
            {"name": "Café Parisien", "cuisines": [CuisineType.FRENCH], "price": PriceRange.UPSCALE,
             "ambiance": [Ambiance.ROMANTIC, Ambiance.UPSCALE], "desc": "Classic French bistro with wine cellar",
             "dishes": ["Coq au Vin", "Escargot", "Crème Brûlée"], "dietary": ["vegetarian options"]},
            {"name": "Le Petit Bistro", "cuisines": [CuisineType.FRENCH], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.COZY, Ambiance.ROMANTIC], "desc": "Charming French café with fresh pastries",
             "dishes": ["Croissants", "French Onion Soup", "Quiche"], "dietary": ["vegetarian"]},
            
            # Seafood
            {"name": "The Catch", "cuisines": [CuisineType.SEAFOOD], "price": PriceRange.UPSCALE,
             "ambiance": [Ambiance.TRENDY, Ambiance.UPSCALE], "desc": "Fresh daily catches and raw bar",
             "dishes": ["Oysters", "Grilled Salmon", "Lobster Roll"], "dietary": ["gluten-free options"]},
            {"name": "Harbor Fish Co.", "cuisines": [CuisineType.SEAFOOD, CuisineType.AMERICAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.CASUAL, Ambiance.FAMILY_FRIENDLY], "desc": "Casual waterfront seafood dining",
             "dishes": ["Fish & Chips", "Clam Chowder", "Shrimp Tacos"], "dietary": ["gluten-free options"]},
            
            # Vegetarian & Fusion
            {"name": "Green Garden", "cuisines": [CuisineType.VEGETARIAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.TRENDY, Ambiance.COZY], "desc": "Creative plant-based cuisine that delights",
             "dishes": ["Buddha Bowl", "Jackfruit Tacos", "Vegan Cheesecake"], "dietary": ["vegetarian", "vegan", "gluten-free"]},
            {"name": "Fusion Lab", "cuisines": [CuisineType.FUSION], "price": PriceRange.UPSCALE,
             "ambiance": [Ambiance.TRENDY, Ambiance.UPSCALE], "desc": "Innovative fusion of global flavors",
             "dishes": ["Korean BBQ Tacos", "Miso Glazed Salmon", "Matcha Tiramisu"], "dietary": ["vegetarian options", "gluten-free options"]},
            {"name": "Spice Route", "cuisines": [CuisineType.FUSION, CuisineType.INDIAN], "price": PriceRange.MODERATE,
             "ambiance": [Ambiance.TRENDY, Ambiance.LIVELY], "desc": "Indo-fusion with bold, creative flavors",
             "dishes": ["Tikka Masala Pizza", "Curry Burger", "Chai Crème Brûlée"], "dietary": ["vegetarian options"]},
        ]
        
        # Generate 75 restaurants by distributing configs across neighborhoods
        restaurant_id = 1
        for i, config in enumerate(restaurant_configs):
            # Each restaurant type appears in 3 different neighborhoods
            for j in range(3):
                if restaurant_id > 75:
                    break
                    
                neighborhood_idx = (i * 3 + j) % len(neighborhoods)
                neighborhood, base_address = neighborhoods[neighborhood_idx]
                
                # Vary the address number
                address = f"{100 + restaurant_id} {base_address.split(' ', 1)[1]}"
                
                # Create restaurant with variations
                restaurant = Restaurant(
                    id=f"REST{restaurant_id:03d}",
                    name=f"{config['name']} - {neighborhood}",
                    address=address,
                    city="Metro City",
                    neighborhood=neighborhood,
                    phone=f"(555) {100 + restaurant_id:03d}-{1000 + restaurant_id:04d}",
                    cuisine_types=config["cuisines"],
                    price_range=config["price"],
                    ambiance=config["ambiance"],
                    rating=round(random.uniform(3.8, 4.9), 1),
                    total_reviews=random.randint(50, 500),
                    seating_capacity=random.randint(40, 150),
                    has_private_dining=random.random() > 0.7,
                    has_outdoor_seating=random.random() > 0.5,
                    has_bar=random.random() > 0.4,
                    wheelchair_accessible=random.random() > 0.1,
                    parking_available=random.random() > 0.6,
                    accepts_walkins=True,
                    open_time="11:00" if random.random() > 0.3 else "10:00",
                    close_time="22:00" if random.random() > 0.3 else "23:00",
                    description=config["desc"],
                    popular_dishes=config["dishes"],
                    dietary_options=config.get("dietary", [])
                )
                
                self.restaurants[restaurant.id] = restaurant
                restaurant_id += 1
        
        print(f"Initialized database with {len(self.restaurants)} restaurants")
    def _load_or_seed_restaurants(self) -> None:
        persisted = neon_db.load_restaurants()
        if persisted:
            self.restaurants = {row["id"]: Restaurant(**row) for row in persisted}
            return
        neon_db.upsert_restaurants([
            restaurant.model_dump(mode="json") if hasattr(restaurant, "model_dump") else restaurant.dict()
            for restaurant in self.restaurants.values()
        ])

    def _load_reservations(self) -> None:
        for row in neon_db.load_reservations():
            row["status"] = ReservationStatus(row["status"])
            self.reservations[row["id"]] = Reservation(**row)

    @staticmethod
    def _reservation_data(reservation: Reservation) -> dict:
        return reservation.model_dump() if hasattr(reservation, "model_dump") else reservation.dict()

    
    def get_all_restaurants(self) -> List[Restaurant]:
        """Get all restaurants"""
        return list(self.restaurants.values())
    
    def get_restaurant_by_id(self, restaurant_id: str) -> Optional[Restaurant]:
        """Get a specific restaurant by ID"""
        return self.restaurants.get(restaurant_id)
    
    def search_restaurants(
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
    ) -> List[Restaurant]:
        """Search restaurants with filters"""
        results = list(self.restaurants.values())
        
        if cuisine:
            cuisine_lower = cuisine.lower()
            results = [r for r in results if any(
                cuisine_lower in c.value.lower() for c in r.cuisine_types
            )]
        
        if price_range:
            # Handle both symbol and name
            price_map = {"$": PriceRange.BUDGET, "$$": PriceRange.MODERATE, 
                        "$$$": PriceRange.UPSCALE, "$$$$": PriceRange.FINE_DINING,
                        "budget": PriceRange.BUDGET, "moderate": PriceRange.MODERATE,
                        "upscale": PriceRange.UPSCALE, "fine_dining": PriceRange.FINE_DINING}
            target_price = price_map.get(price_range.lower().replace(" ", "_"))
            if target_price:
                results = [r for r in results if r.price_range == target_price]
        
        if neighborhood:
            neighborhood_lower = neighborhood.lower()
            results = [r for r in results if neighborhood_lower in r.neighborhood.lower()]
        
        if min_rating:
            results = [r for r in results if r.rating >= min_rating]
        
        if party_size:
            # Filter by capacity (allow 10% overflow for flexibility)
            results = [r for r in results if r.seating_capacity >= party_size * 0.9]
        
        if ambiance:
            ambiance_lower = ambiance.lower().replace("-", "_").replace(" ", "_")
            results = [r for r in results if any(
                ambiance_lower in a.value.lower().replace("-", "_").replace(" ", "_") 
                for a in r.ambiance
            )]
        
        if needs_wheelchair_access:
            results = [r for r in results if r.wheelchair_accessible]
        
        if needs_outdoor_seating:
            results = [r for r in results if r.has_outdoor_seating]
        
        if needs_private_dining:
            results = [r for r in results if r.has_private_dining]
        
        if dietary_requirement:
            diet_lower = dietary_requirement.lower()
            results = [r for r in results if any(
                diet_lower in d.lower() for d in r.dietary_options
            )]
        
        # Sort by rating
        results.sort(key=lambda x: x.rating, reverse=True)
        
        return results
    
    def get_recommendations(self, preferences: CustomerPreferences, limit: int = 5) -> List[Restaurant]:
        """Get personalized restaurant recommendations"""
        results = list(self.restaurants.values())
        scores = {}
        
        for r in results:
            score = 0
            
            # Cuisine match (high weight)
            if preferences.cuisine_preferences:
                for pref in preferences.cuisine_preferences:
                    if pref in r.cuisine_types:
                        score += 30
            
            # Price range match
            if preferences.price_range and r.price_range == preferences.price_range:
                score += 20
            
            # Ambiance match
            if preferences.ambiance_preferences:
                for pref in preferences.ambiance_preferences:
                    if pref in r.ambiance:
                        score += 15
            
            # Neighborhood match
            if preferences.neighborhood:
                if preferences.neighborhood.lower() in r.neighborhood.lower():
                    score += 25
            
            # Accessibility requirements
            if preferences.needs_wheelchair_access and not r.wheelchair_accessible:
                score -= 100  # Disqualify
            if preferences.needs_outdoor_seating and not r.has_outdoor_seating:
                score -= 50
            if preferences.needs_private_dining and not r.has_private_dining:
                score -= 50
            
            # Party size compatibility
            if preferences.party_size:
                if r.seating_capacity < preferences.party_size:
                    score -= 100  # Disqualify
                elif r.has_private_dining and preferences.party_size >= 8:
                    score += 10  # Bonus for large parties with private dining
            
            # Dietary requirements
            if preferences.dietary_requirements:
                for diet in preferences.dietary_requirements:
                    if any(diet.lower() in d.lower() for d in r.dietary_options):
                        score += 15
                    else:
                        score -= 20
            
            # Occasion-based scoring
            if preferences.occasion:
                occasion = preferences.occasion.lower()
                if "romantic" in occasion or "anniversary" in occasion or "date" in occasion:
                    if Ambiance.ROMANTIC in r.ambiance:
                        score += 25
                elif "business" in occasion or "meeting" in occasion:
                    if Ambiance.BUSINESS in r.ambiance:
                        score += 25
                elif "birthday" in occasion or "celebration" in occasion:
                    if Ambiance.LIVELY in r.ambiance or r.has_private_dining:
                        score += 20
                elif "family" in occasion:
                    if Ambiance.FAMILY_FRIENDLY in r.ambiance:
                        score += 25
            
            # Rating bonus
            score += r.rating * 5
            
            scores[r.id] = score
        
        # Filter out disqualified restaurants and sort by score
        qualified = [(r, scores[r.id]) for r in results if scores[r.id] > 0]
        qualified.sort(key=lambda x: x[1], reverse=True)
        
        return [r for r, _ in qualified[:limit]]
    
    def get_availability(
        self, 
        restaurant_id: str, 
        date_str: str,
        party_size: int = 2
    ) -> Optional[Availability]:
        """Get availability for a restaurant on a specific date"""
        restaurant = self.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            return None
        
        # Generate time slots based on restaurant hours
        time_slots = []
        
        # Parse open/close times
        open_hour = int(restaurant.open_time.split(":")[0])
        close_hour = int(restaurant.close_time.split(":")[0])
        
        if neon_db.enabled:
            reserved_times = neon_db.get_booked_seats_by_slot(restaurant_id, date_str)
        else:
            existing = [r for r in self.reservations.values() 
                       if r.restaurant_id == restaurant_id 
                       and r.date == date_str 
                       and r.status == ReservationStatus.CONFIRMED]
            reserved_times = defaultdict(int)
            for reservation in existing:
                reserved_times[reservation.time] += reservation.party_size
        # Generate 30-minute slots
        for hour in range(open_hour, close_hour):
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                
                # Calculate available seats (simplified model)
                base_available = restaurant.seating_capacity // 3  # Assume 3 seatings
                reserved = reserved_times.get(time_str, 0)
                available = max(0, base_available - reserved)
                
                # Peak hours (6-8 PM) have less availability
                is_peak = 18 <= hour <= 20
                if is_peak:
                    available = int(available * 0.7)
                
                if available >= party_size:
                    time_slots.append(TimeSlot(
                        time=time_str,
                        available_seats=available,
                        is_peak=is_peak
                    ))
        
        return Availability(
            restaurant_id=restaurant_id,
            date=date_str,
            time_slots=time_slots
        )
    
    def create_reservation(
        self,
        restaurant_id: str,
        customer_name: str,
        customer_phone: str,
        party_size: int,
        date_str: str,
        time_str: str,
        customer_email: Optional[str] = None,
        special_requests: Optional[str] = None,
        occasion: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Optional[Reservation]:
        """Create a reservation only for a valid future opening-hours slot."""
        restaurant = self.get_restaurant_by_id(restaurant_id)
        if not restaurant or not customer_name.strip() or not customer_phone.strip():
            return None

        if not isinstance(party_size, int) or not 1 <= party_size <= restaurant.seating_capacity:
            return None

        try:
            reservation_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            reservation_time = datetime.strptime(time_str, "%H:%M").time()
        except (TypeError, ValueError):
            return None

        if reservation_date < date.today():
            return None

        open_time = datetime.strptime(restaurant.open_time, "%H:%M").time()
        close_time = datetime.strptime(restaurant.close_time, "%H:%M").time()
        if reservation_time < open_time or reservation_time >= close_time or reservation_time.minute not in (0, 30):
            return None

        availability = self.get_availability(restaurant_id, date_str, party_size)
        if not availability:
            return None

        time_available = any(
            slot.time == time_str and slot.available_seats >= party_size
            for slot in availability.time_slots
        )
        if not time_available:
            return None
        
        # Generate cryptographically random, unique confirmation code and ID
        while True:
            conf_code = "GF" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            if conf_code not in [r.confirmation_code for r in self.reservations.values()]:
                if neon_db.enabled:
                    existing = neon_db.get_reservation_by_code(conf_code)
                    if existing:
                        continue
                break

        res_id = f"RES_{secrets.token_hex(6)}"
        # Create reservation
        reservation = Reservation(
            id=res_id,
            restaurant_id=restaurant_id,
            restaurant_name=restaurant.name,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            party_size=party_size,
            date=date_str,
            time=time_str,
            special_requests=special_requests,
            occasion=occasion,
            status=ReservationStatus.CONFIRMED,
            confirmation_code=conf_code,
            user_id=user_id
        )
        
        self.reservations[reservation.id] = reservation
        if neon_db.enabled:
            neon_db.save_reservation(self._reservation_data(reservation))
        return reservation
    
    def get_reservation_by_code(self, confirmation_code: str) -> Optional[Reservation]:
        """Look up a reservation by confirmation code"""
        if neon_db.enabled:
            row = neon_db.get_reservation_by_code(confirmation_code)
            if row:
                row["status"] = ReservationStatus(row["status"])
                res = Reservation(**row)
                self.reservations[res.id] = res
                return res
            return None
        for res in self.reservations.values():
            if res.confirmation_code.upper() == confirmation_code.upper():
                return res
        return None

    def get_reservations_by_user(self, user_id: str) -> List[Reservation]:
        """Look up all reservations belonging to a registered user"""
        if neon_db.enabled:
            rows = neon_db.load_reservations(user_id=user_id)
            results = []
            for row in rows:
                row["status"] = ReservationStatus(row["status"])
                res = Reservation(**row)
                self.reservations[res.id] = res
                results.append(res)
            return results
        return [r for r in self.reservations.values() if getattr(r, "user_id", None) == user_id]
    def get_reservation_by_phone(self, phone: str) -> List[Reservation]:
        """Look up reservations by phone number"""
        # Normalize phone number (remove non-digits)
        normalized = "".join(c for c in phone if c.isdigit())
        results = []
        for res in self.reservations.values():
            res_normalized = "".join(c for c in res.customer_phone if c.isdigit())
            if normalized in res_normalized or res_normalized in normalized:
                results.append(res)
        return results
    
    def modify_reservation(
        self,
        confirmation_code: str,
        new_date: Optional[str] = None,
        new_time: Optional[str] = None,
        new_party_size: Optional[int] = None,
        new_special_requests: Optional[str] = None
    ) -> Optional[Reservation]:
        """Modify an existing reservation"""
        reservation = self.get_reservation_by_code(confirmation_code)
        if not reservation or reservation.status == ReservationStatus.CANCELLED:
            return None
        
        # Check availability for new date/time if changed
        check_date = new_date or reservation.date
        check_time = new_time or reservation.time
        check_size = new_party_size or reservation.party_size
        
        if new_date or new_time or new_party_size:
            availability = self.get_availability(reservation.restaurant_id, check_date, check_size)
            if not availability:
                return None
            
            time_available = any(
                slot.time == check_time and slot.available_seats >= check_size 
                for slot in availability.time_slots
            )
            if not time_available:
                return None
        
        # Apply changes
        if new_date:
            reservation.date = new_date
        if new_time:
            reservation.time = new_time
        if new_party_size:
            reservation.party_size = new_party_size
        if new_special_requests:
            reservation.special_requests = new_special_requests
        if neon_db.enabled:
            neon_db.update_reservation(self._reservation_data(reservation))
        
        return reservation
    
    def cancel_reservation(self, confirmation_code: str) -> Optional[Reservation]:
        """Cancel a reservation"""
        reservation = self.get_reservation_by_code(confirmation_code)
        if not reservation:
            return None
        
        reservation.status = ReservationStatus.CANCELLED
        if neon_db.enabled:
            neon_db.update_reservation(self._reservation_data(reservation))
        return reservation
    
    def get_neighborhoods(self) -> List[str]:
        """Get list of all neighborhoods"""
        return list(set(r.neighborhood for r in self.restaurants.values()))
    
    def get_cuisine_types(self) -> List[str]:
        """Get list of all cuisine types"""
        cuisines = set()
        for r in self.restaurants.values():
            for c in r.cuisine_types:
                cuisines.add(c.value)
        return sorted(list(cuisines))


# Global database instance
db = RestaurantDatabase()
