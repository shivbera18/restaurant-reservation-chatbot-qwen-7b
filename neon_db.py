"""Minimal Neon PostgreSQL persistence for GoodFoods reservations."""
import json
from collections.abc import Generator
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

from config import DATABASE_URL
SCHEMA = """
CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    use_mock BOOLEAN NOT NULL DEFAULT FALSE,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reservations_slot_idx
    ON reservations (restaurant_id, reservation_date, reservation_time)
    WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS reservations_phone_idx ON reservations (customer_phone);
"""


class NeonDatabase:
    def __init__(self, url: str = DATABASE_URL):
        self.url = url

    @property
    def enabled(self) -> bool:
        return bool(self.url and psycopg)
    @contextmanager
    def connection(self) -> Generator[psycopg.Connection, None, None]:
        if not self.enabled:
            raise RuntimeError("DATABASE_URL is required for Neon persistence.")
        with psycopg.connect(self.url, row_factory=dict_row) as connection:
            yield connection

    def migrate(self) -> None:
        with self.connection() as connection, connection.cursor() as cursor:
            cursor.execute(SCHEMA)

    def load_reservations(self) -> list[dict]:
        with self.connection() as connection, connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, restaurant_id, restaurant_name, customer_name, customer_phone,
                       customer_email, party_size, reservation_date::text AS date,
                       to_char(reservation_time, 'HH24:MI') AS time, special_requests,
                       occasion, status, created_at, confirmation_code
                FROM reservations
            """)
            return list(cursor.fetchall())

    def load_restaurants(self) -> list[dict]:
        with self.connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT data FROM restaurants ORDER BY id")
            return [row["data"] for row in cursor.fetchall()]

    def upsert_restaurants(self, restaurants: list[dict]) -> None:
        with self.connection() as connection, connection.cursor() as cursor:
            cursor.executemany("""
                INSERT INTO restaurants (id, data)
                VALUES (%(id)s, %(data)s::jsonb)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
            """, [{"id": restaurant["id"], "data": json.dumps(restaurant)} for restaurant in restaurants])

    def save_session(self, session_id: str, provider: str, model: str, use_mock: bool) -> None:
        with self.connection() as connection, connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO chat_sessions (id, provider, model, use_mock)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    provider = EXCLUDED.provider, model = EXCLUDED.model,
                    use_mock = EXCLUDED.use_mock, updated_at = NOW()
            """, (session_id, provider, model, use_mock))

    def save_message(self, session_id: str, role: str, content: str) -> None:
        with self.connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
                (session_id, role, content),
            )

    def save_reservation(self, reservation: dict) -> None:
        with self.connection() as connection, connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO reservations (
                    id, restaurant_id, restaurant_name, customer_name, customer_phone,
                    customer_email, party_size, reservation_date, reservation_time,
                    special_requests, occasion, status, created_at, confirmation_code
                ) VALUES (
                    %(id)s, %(restaurant_id)s, %(restaurant_name)s, %(customer_name)s, %(customer_phone)s,
                    %(customer_email)s, %(party_size)s, %(date)s, %(time)s,
                    %(special_requests)s, %(occasion)s, %(status)s, %(created_at)s, %(confirmation_code)s
                )
            """, reservation)

    def update_reservation(self, reservation: dict) -> None:
        with self.connection() as connection, connection.cursor() as cursor:
            cursor.execute("""
                UPDATE reservations
                SET party_size = %(party_size)s, reservation_date = %(date)s,
                    reservation_time = %(time)s, special_requests = %(special_requests)s,
                    status = %(status)s
                WHERE id = %(id)s
            """, reservation)


neon_db = NeonDatabase()
