import asyncio
import json
from typing import Any, Dict, Optional, Tuple
import unittest

from server import app


def stream_request(
    path: str,
    data: Dict[str, Any],
    headers: Optional[Dict[str, str]] = None,
) -> Tuple[int, str]:
    body_bytes = json.dumps(data).encode("utf-8")
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
        "method": "POST",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": raw_headers,
        "client": ("127.0.0.1", 12345),
        "server": ("127.0.0.1", 80),
    }

    chunks = []
    status = 200

    async def receive():
        return {"type": "http.request", "body": body_bytes, "more_body": False}

    async def send(message):
        nonlocal status
        if message["type"] == "http.response.start":
            status = message["status"]
        elif message["type"] == "http.response.body":
            chunks.append(message.get("body", b"").decode("utf-8"))

    async def runner():
        await app(scope, receive, send)

    asyncio.run(runner())
    return status, "".join(chunks)


class TestSSEStreaming(unittest.TestCase):
    def test_sse_streaming_endpoint(self):
        status, body = stream_request(
            "/api/chat/stream",
            data={"message": "What Italian restaurants do you have in Downtown?", "use_mock": True},
        )
        self.assertEqual(status, 200)
        self.assertIn("data: ", body)
        self.assertIn('"type": "token"', body)
        self.assertIn('"type": "final"', body)

    def test_empty_message_rejection_on_stream(self):
        status, _ = stream_request(
            "/api/chat/stream",
            data={"message": "   "},
        )
        self.assertEqual(status, 422)


if __name__ == "__main__":
    unittest.main()
