import asyncio
import datetime
import json
from typing import Any, Dict, Optional, Tuple
import unittest

from database import db
from server import app


def make_request(
    path: str,
    method: str = "GET",
    data: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> Tuple[int, Any]:
    """Execute request directly against the ASGI app with zero socket overhead."""
    body_bytes = json.dumps(data).encode("utf-8") if data is not None else b""
    raw_headers = [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(body_bytes)).encode("utf-8")),
    ]
    if headers:
        for k, v in headers.items():
            raw_headers.append((k.lower().encode("utf-8"), v.encode("utf-8")))

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": raw_headers,
        "client": ("127.0.0.1", 12345),
        "server": ("127.0.0.1", 80),
    }

    response_status = 200
    response_headers = []
    response_body = bytearray()

    async def receive():
        return {"type": "http.request", "body": body_bytes, "more_body": False}

    async def send(message):
        nonlocal response_status, response_headers, response_body
        if message["type"] == "http.response.start":
            response_status = message["status"]
            response_headers = message.get("headers", [])
        elif message["type"] == "http.response.body":
            response_body.extend(message.get("body", b""))

    asyncio.run(app(scope, receive, send))

    body_str = response_body.decode("utf-8")
    try:
        parsed = json.loads(body_str) if body_str else {}
    except (json.JSONDecodeError, UnicodeDecodeError):
        parsed = {"raw": body_str}
    return response_status, parsed


class TestUserAuthAndIsolation(unittest.TestCase):
    def setUp(self):
        self.ts = int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000)
        self.user_a_email = f"alice_{self.ts}@example.com"
        self.user_b_email = f"bob_{self.ts}@example.com"
        self.password = "SecurePass123!"

    def test_registration_and_login_flow(self):
        # 1. Register User A
        status, data = make_request(
            "/api/auth/register",
            method="POST",
            data={
                "email": self.user_a_email,
                "password": self.password,
                "name": "Alice Smith",
                "phone": "555-0100",
            },
        )
        self.assertEqual(status, 200)
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], self.user_a_email)
        self.assertEqual(data["user"]["name"], "Alice Smith")
        token_a = data["token"]

        # 2. Duplicate registration fails with 409
        dup_status, _ = make_request(
            "/api/auth/register",
            method="POST",
            data={
                "email": self.user_a_email,
                "password": "AnotherPassword",
                "name": "Alice Clone",
            },
        )
        self.assertEqual(dup_status, 409)

        # 3. Login with wrong password fails with 401
        bad_status, _ = make_request(
            "/api/auth/login",
            method="POST",
            data={
                "email": self.user_a_email,
                "password": "WrongPassword!",
            },
        )
        self.assertEqual(bad_status, 401)

        # 4. Login with correct password succeeds
        login_status, login_data = make_request(
            "/api/auth/login",
            method="POST",
            data={
                "email": self.user_a_email,
                "password": self.password,
            },
        )
        self.assertEqual(login_status, 200)
        self.assertIn("token", login_data)

        # 5. /api/auth/me returns user profile
        me_status, me_data = make_request(
            "/api/auth/me", headers={"Authorization": f"Bearer {token_a}"}
        )
        self.assertEqual(me_status, 200)
        self.assertEqual(me_data["user"]["email"], self.user_a_email)

    def test_reservation_view_and_mutation_isolation(self):
        # Register User A
        _, reg_a = make_request(
            "/api/auth/register",
            method="POST",
            data={
                "email": self.user_a_email,
                "password": self.password,
                "name": "Alice User",
            },
        )
        token_a = reg_a["token"]
        user_a_id = reg_a["user"]["id"]

        # Register User B
        _, reg_b = make_request(
            "/api/auth/register",
            method="POST",
            data={
                "email": self.user_b_email,
                "password": self.password,
                "name": "Bob User",
            },
        )
        token_b = reg_b["token"]

        # Create a reservation directly owned by User A
        tomorrow = (datetime.datetime.now(datetime.timezone.utc).date() + datetime.timedelta(days=2)).isoformat()
        res_a = db.create_reservation(
            restaurant_id="REST001",
            customer_name="Alice User",
            customer_phone="555-0100",
            party_size=2,
            date_str=tomorrow,
            time_str="19:00",
            special_requests="Window table",
            user_id=user_a_id,
        )
        self.assertIsNotNone(res_a)
        code_a = res_a.confirmation_code

        # 1. User A lists reservations -> sees their reservation
        list_a_status, list_a_data = make_request(
            "/api/reservations", headers={"Authorization": f"Bearer {token_a}"}
        )
        self.assertEqual(list_a_status, 200)
        codes_a = [r["confirmation_code"] for r in list_a_data]
        self.assertIn(code_a, codes_a)

        # 2. User B lists reservations -> CANNOT see User A's reservation
        list_b_status, list_b_data = make_request(
            "/api/reservations", headers={"Authorization": f"Bearer {token_b}"}
        )
        self.assertEqual(list_b_status, 200)
        codes_b = [r["confirmation_code"] for r in list_b_data]
        self.assertNotIn(code_a, codes_b)

        # 3. Unauthenticated list -> returns empty list
        anon_status, anon_data = make_request("/api/reservations")
        self.assertEqual(anon_status, 200)
        self.assertEqual(anon_data, [])

        # 4. User B attempts to modify User A's reservation -> 403 Forbidden
        mod_b_status, _ = make_request(
            "/api/reservations/modify",
            method="POST",
            headers={"Authorization": f"Bearer {token_b}"},
            data={"confirmation_code": code_a, "new_party_size": 4},
        )
        self.assertEqual(mod_b_status, 403)

        # 5. User B attempts to cancel User A's reservation -> 403 Forbidden
        cancel_b_status, _ = make_request(
            "/api/reservations/cancel",
            method="POST",
            headers={"Authorization": f"Bearer {token_b}"},
            data={"confirmation_code": code_a},
        )
        self.assertEqual(cancel_b_status, 403)

        # 6. Unauthenticated cancellation -> 401 Unauthorized
        cancel_anon_status, _ = make_request(
            "/api/reservations/cancel",
            method="POST",
            data={"confirmation_code": code_a},
        )
        self.assertEqual(cancel_anon_status, 401)

        # 7. User A modifies their own reservation -> 200 Success
        mod_a_status, mod_a_data = make_request(
            "/api/reservations/modify",
            method="POST",
            headers={"Authorization": f"Bearer {token_a}"},
            data={
                "confirmation_code": code_a,
                "new_party_size": 3,
                "new_special_requests": "Quiet corner please",
            },
        )
        self.assertEqual(mod_a_status, 200)
        self.assertEqual(mod_a_data["reservation"]["party_size"], 3)
        self.assertEqual(
            mod_a_data["reservation"]["special_requests"], "Quiet corner please"
        )

        # 8. User A cancels their own reservation -> 200 Success
        cancel_a_status, cancel_a_data = make_request(
            "/api/reservations/cancel",
            method="POST",
            headers={"Authorization": f"Bearer {token_a}"},
            data={"confirmation_code": code_a},
        )
        self.assertEqual(cancel_a_status, 200)
        self.assertEqual(cancel_a_data["reservation"]["status"], "cancelled")


if __name__ == "__main__":
    unittest.main()
