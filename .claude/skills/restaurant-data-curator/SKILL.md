---
name: restaurant-data-curator
description: >
  Validates, inspects, and modifies the 75-restaurant dataset in database.py.
  Enforces valid schema fields (CuisineType, neighborhood, price tiers,
  ratings, opening/closing hours, table capacity, and popular dishes).
argument-hint: "[stats|validate|search]"
license: MIT
---

# Restaurant Data Curator

Maintains integrity and searchability of the 75-restaurant database catalog in `database.py`.

## Data Schema Rules (`models.py`)

- **ID Format**: `REST001` through `REST075`.
- **Cuisine Types**: Must be members of `CuisineType` enum (e.g. `AMERICAN`, `ITALIAN`, `JAPANESE`, `THAI`, `MEXICAN`, `FRENCH`, `SEAFOOD`, `STEAKHOUSE`, `VEGETARIAN`, `MEDITERRANEAN`, `KOREAN`, `VIETNAMESE`, `CHINESE`, `INDIAN`, `FUSION`).
- **Price Range**: `$` (Budget), `$$` (Moderate), `$$$` (Upscale), `$$$$` (Fine Dining).
- **Hours**: String `HH:MM` format (e.g. `open_time="11:00"`, `close_time="22:00"`).
- **Capacity**: Integer between 20 and 150 seats.
- **Popular Dishes**: List of 3 to 6 signature dishes.

## Integrity Verification Script

```bash
python -c "
from database import db
from models import CuisineType, PriceRange

assert len(db.restaurants) == 72, f'Expected 72 restaurants, got {len(db.restaurants)}'
for r_id, r in db.restaurants.items():
    assert r.id == r_id, f'ID mismatch: {r_id}'
    assert 1.0 <= r.rating <= 5.0, f'Invalid rating for {r.name}: {r.rating}'
    assert len(r.cuisine_types) > 0, f'No cuisine specified for {r.name}'
    assert r.open_time and r.close_time, f'Missing hours for {r.name}'
print('All restaurant records pass schema validation!')
"
```
