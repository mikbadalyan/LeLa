from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

TMP_DIR = tempfile.mkdtemp(prefix="lela-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(TMP_DIR) / 'qa-regressions.db'}"
os.environ.setdefault("BACKEND_PUBLIC_URL", "http://testserver")

from fastapi.testclient import TestClient

from app.db.init_db import init_db
from app.db.session import Base, SessionLocal, engine
from app.main import app


class QaRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def setUp(self) -> None:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as session:
            init_db(session)

    def test_editorial_detail_route_returns_complete_payload(self) -> None:
        response = self.client.get("/api/editorial/person-tomi")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], "person-tomi")
        self.assertEqual(payload["type"], "person")
        self.assertEqual(payload["title"], "Tomi Ungerer")
        self.assertIn("related", payload)
        self.assertIn("contributor", payload)

    def test_feed_type_filter_returns_only_requested_cards(self) -> None:
        response = self.client.get("/api/feed?type=person&limit=10")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(len(payload["items"]), 1)
        self.assertTrue(all(item["type"] == "person" for item in payload["items"]))

    def test_chat_fallback_mode_is_explicit(self) -> None:
        with patch(
            "app.services.chat_service._request_provider_completion",
            side_effect=RuntimeError("provider offline"),
        ):
            response = self.client.post(
                "/api/chat/respond",
                json={
                    "message": "Parle-moi de Tomi Ungerer",
                    "history": [],
                    "current_path": "/feed?focus=chat",
                    "current_focus": "chat",
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["mode"], "fallback")
        self.assertIsNotNone(payload["availability_message"])
        self.assertGreaterEqual(len(payload["suggested_editorials"]), 1)


if __name__ == "__main__":
    unittest.main()
