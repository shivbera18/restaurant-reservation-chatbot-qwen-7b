"""Neon PostgreSQL database and repository layer for GoodFoods AI Concierge.

Handles schema migrations, user authentication, restaurant catalog,
and transactional reservation lifecycle.
"""
from collections.abc import Generator
from contextlib import contextmanager
import datetime
import hashlib
import json
import secrets
from typing import Any, Dict, List, Optional

import psycopg
from psycopg.rows import dict_row

from config import DATABASE_URL

SCHEMA = """
-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS auth_sessions_token_idx ON auth_sessions (token);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id);

-- Restaurant Catalog
CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT,
    neighborhood TEXT,
    city TEXT DEFAULT 'GoodFoods Metro',
    cuisine_types TEXT[] DEFAULT '{}',
    price_range TEXT DEFAULT '$$',
    rating NUMERIC(2,1) DEFAULT 4.5,
    seating_capacity INTEGER DEFAULT 60,
    open_time TEXT DEFAULT '11:00',
    close_time TEXT DEFAULT '22:00',
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS restaurants_neighborhood_idx ON restaurants (neighborhood);
CREATE INDEX IF NOT EXISTS restaurants_rating_idx ON restaurants (rating DESC);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    restaurant_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    party_size INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 20),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    special_requests TEXT,
    occasion TEXT,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    confirmation_code TEXT NOT NULL UNIQUE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reservations_slot_idx
    ON reservations (restaurant_id, reservation_date, reservation_time)
    WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS reservations_phone_idx ON reservations (customer_phone);
CREATE INDEX IF NOT EXISTS reservations_code_idx ON reservations (confirmation_code);
CREATE INDEX IF NOT EXISTS reservations_user_idx ON reservations (user_id);

-- Chat Sessions & Messages
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    use_mock BOOLEAN NOT NULL DEFAULT FALSE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages (session_id, id);
"""


def _hash_password(password: str, salt: bytes) -> str:
    """Hash password using scrypt with salt."""
    return hashlib.scrypt(password.encode('utf-8'), salt=salt, n=16384, r=8, p=1).hex()


class NeonDatabase:
    def __init__(self, url: str = DATABASE_URL):
        self.url = url

    @property
    def enabled(self) -> bool:
        return bool(self.url and psycopg)
    @contextmanager
    def connection(self) -> Generator[psycopg.Connection[psycopg.rows.DictRow], None, None]:
        if not self.enabled:
            raise RuntimeError("DATABASE_URL is required for Neon persistence.")
        with psycopg.connect(self.url, row_factory=dict_row) as conn:
            yield conn
    def migrate(self) -> None:
        """Run all database migrations idempotently."""
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    password_salt TEXT NOT NULL,
                    name TEXT NOT NULL,
                    phone TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS users_email_idx ON users (LOWER(email));

                CREATE TABLE IF NOT EXISTS auth_sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS auth_sessions_token_idx ON auth_sessions (token);
                CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id);

                CREATE TABLE IF NOT EXISTS restaurants (
                    id TEXT PRIMARY KEY,
                    data JSONB NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS name TEXT;
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS neighborhood TEXT;
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'GoodFoods Metro';
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cuisine_types TEXT[] DEFAULT '{}';
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_range TEXT DEFAULT '$$';
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 4.5;
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS seating_capacity INTEGER DEFAULT 60;
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS open_time TEXT DEFAULT '11:00';
                ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS close_time TEXT DEFAULT '22:00';
                CREATE INDEX IF NOT EXISTS restaurants_neighborhood_idx ON restaurants (neighborhood);
                CREATE INDEX IF NOT EXISTS restaurants_rating_idx ON restaurants (rating DESC);

                CREATE TABLE IF NOT EXISTS reservations (
                    id TEXT PRIMARY KEY,
                    restaurant_id TEXT NOT NULL,
                    restaurant_name TEXT NOT NULL,
                    customer_name TEXT NOT NULL,
                    customer_phone TEXT NOT NULL,
                    customer_email TEXT,
                    party_size INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 20),
                    reservation_date DATE NOT NULL,
                    reservation_time TIME NOT NULL,
                    special_requests TEXT,
                    occasion TEXT,
                    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
                    confirmation_code TEXT NOT NULL UNIQUE,
                    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                ALTER TABLE reservations ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
                CREATE INDEX IF NOT EXISTS reservations_slot_idx
                    ON reservations (restaurant_id, reservation_date, reservation_time)
                    WHERE status = 'confirmed';
                CREATE INDEX IF NOT EXISTS reservations_phone_idx ON reservations (customer_phone);
                CREATE INDEX IF NOT EXISTS reservations_code_idx ON reservations (confirmation_code);
                CREATE INDEX IF NOT EXISTS reservations_user_idx ON reservations (user_id);

                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id TEXT PRIMARY KEY,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    use_mock BOOLEAN NOT NULL DEFAULT FALSE,
                    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

                CREATE TABLE IF NOT EXISTS chat_messages (
                    id BIGSERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
                    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                    content TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages (session_id, id);
            """)

    # -----------------------------------------------------------------------
    # Authentication & User Management
    # -----------------------------------------------------------------------

    def create_user(self, email: str, password: str, name: str, phone: Optional[str] = None) -> Dict[str, Any]:
        email_clean = email.strip().lower()
        name_clean = name.strip()
        phone_clean = phone.strip() if phone else None
        salt = secrets.token_bytes(16)
        pwd_hash = _hash_password(password, salt)
        user_id = f"usr_{secrets.token_hex(8)}"

        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (id, email, password_hash, password_salt, name, phone)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, email, name, phone, created_at
                """,
                (user_id, email_clean, pwd_hash, salt.hex(), name_clean, phone_clean),
            )
            user = cur.fetchone()
            return dict(user)

    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        email_clean = email.strip().lower()
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, password_hash, password_salt, name, phone, created_at FROM users WHERE email = %s",
                (email_clean,),
            )
            user = cur.fetchone()
            if not user:
                return None

            salt = bytes.fromhex(user["password_salt"])
            computed_hash = _hash_password(password, salt)
            if secrets.compare_digest(computed_hash, user["password_hash"]):
                return {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "phone": user["phone"],
                    "created_at": user["created_at"],
                }
            return None

    def create_auth_session(self, user_id: str, days: int = 30) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days)
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (%s, %s, %s)",
                (token, user_id, expires_at),
            )
            return token

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.id, u.email, u.name, u.phone, u.created_at
                FROM users u
                JOIN auth_sessions s ON u.id = s.user_id
                WHERE s.token = %s AND s.expires_at > NOW()
                """,
                (token,),
            )
            user = cur.fetchone()
            return dict(user) if user else None

    def delete_auth_session(self, token: str) -> bool:
        if not token:
            return False
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM auth_sessions WHERE token = %s", (token,))
            return cur.rowcount > 0

    # -----------------------------------------------------------------------
    # Restaurant Catalog
    # -----------------------------------------------------------------------

    def load_restaurants(self) -> List[Dict[str, Any]]:
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT data FROM restaurants ORDER BY id")
            return [row["data"] for row in cur.fetchall()]

    def upsert_restaurants(self, restaurants: List[Dict[str, Any]]) -> None:
        with self.connection() as conn, conn.cursor() as cur:
            params = []
            for r in restaurants:
                cuisines = r.get("cuisine_types") or r.get("cuisines") or []
                params.append((
                    r["id"],
                    r.get("name", "Unknown"),
                    r.get("neighborhood", "Downtown"),
                    r.get("city", "GoodFoods Metro"),
                    cuisines,
                    r.get("price_range", "$$"),
                    float(r.get("rating", 4.5)),
                    int(r.get("seating_capacity", 60)),
                    r.get("open_time", "11:00"),
                    r.get("close_time", "22:00"),
                    json.dumps(r),
                ))
            cur.executemany(
                """
                INSERT INTO restaurants (
                    id, name, neighborhood, city, cuisine_types, price_range,
                    rating, seating_capacity, open_time, close_time, data
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    neighborhood = EXCLUDED.neighborhood,
                    city = EXCLUDED.city,
                    cuisine_types = EXCLUDED.cuisine_types,
                    price_range = EXCLUDED.price_range,
                    rating = EXCLUDED.rating,
                    seating_capacity = EXCLUDED.seating_capacity,
                    open_time = EXCLUDED.open_time,
                    close_time = EXCLUDED.close_time,
                    data = EXCLUDED.data,
                    updated_at = NOW()
                """,
                params,
            )

    # -----------------------------------------------------------------------
    # Reservations Management
    # -----------------------------------------------------------------------

    def load_reservations(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.connection() as conn, conn.cursor() as cur:
            if user_id:
                cur.execute(
                    """
                    SELECT id, restaurant_id, restaurant_name, customer_name, customer_phone,
                           customer_email, party_size, reservation_date::text AS date,
                           to_char(reservation_time, 'HH24:MI') AS time, special_requests,
                           occasion, status, created_at, confirmation_code, user_id
                    FROM reservations
                    WHERE user_id = %s
                    ORDER BY reservation_date DESC, reservation_time DESC
                    """,
                    (user_id,),
                )
            else:
                cur.execute(
                    """
                    SELECT id, restaurant_id, restaurant_name, customer_name, customer_phone,
                           customer_email, party_size, reservation_date::text AS date,
                           to_char(reservation_time, 'HH24:MI') AS time, special_requests,
                           occasion, status, created_at, confirmation_code, user_id
                    FROM reservations
                    ORDER BY reservation_date DESC, reservation_time DESC
                    """
                )
            return list(cur.fetchall())

    def get_booked_seats_by_slot(self, restaurant_id: str, date_str: str) -> Dict[str, int]:
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT to_char(reservation_time, 'HH24:MI') AS time_slot, SUM(party_size) AS booked
                FROM reservations
                WHERE restaurant_id = %s AND reservation_date = %s AND status = 'confirmed'
                GROUP BY reservation_time
                """,
                (restaurant_id, date_str),
            )
            return {row["time_slot"]: int(row["booked"]) for row in cur.fetchall()}

    def save_reservation(self, reservation: Dict[str, Any]) -> None:
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO reservations (
                    id, restaurant_id, restaurant_name, customer_name, customer_phone,
                    customer_email, party_size, reservation_date, reservation_time,
                    special_requests, occasion, status, created_at, confirmation_code, user_id
                ) VALUES (
                    %(id)s, %(restaurant_id)s, %(restaurant_name)s, %(customer_name)s, %(customer_phone)s,
                    %(customer_email)s, %(party_size)s, %(date)s, %(time)s,
                    %(special_requests)s, %(occasion)s, %(status)s, %(created_at)s, %(confirmation_code)s,
                    %(user_id)s
                )
                ON CONFLICT (id) DO UPDATE SET
                    status = EXCLUDED.status,
                    party_size = EXCLUDED.party_size,
                    reservation_date = EXCLUDED.reservation_date,
                    reservation_time = EXCLUDED.reservation_time,
                    special_requests = EXCLUDED.special_requests,
                    user_id = EXCLUDED.user_id
                """,
                reservation,
            )

    def update_reservation(self, reservation: Dict[str, Any]) -> None:
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                UPDATE reservations
                SET party_size = %(party_size)s,
                    reservation_date = %(date)s,
                    reservation_time = %(time)s,
                    special_requests = %(special_requests)s,
                    status = %(status)s,
                    user_id = COALESCE(%(user_id)s, user_id)
                WHERE id = %(id)s
                """,
                reservation,
            )

    def get_reservation_by_code(self, confirmation_code: str) -> Optional[Dict[str, Any]]:
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, restaurant_id, restaurant_name, customer_name, customer_phone,
                       customer_email, party_size, reservation_date::text AS date,
                       to_char(reservation_time, 'HH24:MI') AS time, special_requests,
                       occasion, status, created_at, confirmation_code, user_id
                FROM reservations
                WHERE UPPER(confirmation_code) = UPPER(%s)
                """,
                (confirmation_code,),
            )
            row = cur.fetchone()
            return dict(row) if row else None

    # -----------------------------------------------------------------------
    # Chat Sessions & Messages
    # -----------------------------------------------------------------------

    def save_session(
        self, session_id: str, provider: str, model: str, use_mock: bool, user_id: Optional[str] = None
    ) -> None:
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_sessions (id, provider, model, use_mock, user_id)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    provider = EXCLUDED.provider,
                    model = EXCLUDED.model,
                    use_mock = EXCLUDED.use_mock,
                    user_id = COALESCE(EXCLUDED.user_id, chat_sessions.user_id),
                    updated_at = NOW()
                """,
                (session_id, provider, model, use_mock, user_id),
            )

    def save_message(self, session_id: str, role: str, content: str) -> None:
        with self.connection() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
                (session_id, role, content),
            )


neon_db = NeonDatabase()
