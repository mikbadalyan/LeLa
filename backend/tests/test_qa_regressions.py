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

    def test_card_fiche_proposal_can_be_ai_reviewed_and_moderated(self) -> None:
        contributor_login = self.client.post(
            "/api/auth/login",
            json={"email": "steve@lela.local", "password": "lela1234"},
        )
        moderator_login = self.client.post(
            "/api/auth/login",
            json={"email": "charles@lela.local", "password": "lela1234"},
        )
        contributor_token = contributor_login.json()["access_token"]
        moderator_token = moderator_login.json()["access_token"]

        proposal_response = self.client.post(
            "/api/contributions/proposals",
            headers={"Authorization": f"Bearer {contributor_token}"},
            json={
                "contribution_type": "create_card",
                "proposed_data": {
                    "card": {
                        "title": "Parlement européen - visite citoyenne",
                        "short_description": "Une proposition de carte sur la vie civique européenne à Strasbourg.",
                        "category_metadata": "lieu",
                        "city": "Strasbourg",
                        "location": "Quartier européen",
                        "main_image": "",
                        "tags": ["Europe", "politique"],
                        "relations": [],
                        "why_exists": "Cette carte relie institutions européennes et exploration locale.",
                        "source_reference": "Note contributeur",
                    }
                },
                "explanation": "Nouvelle carte proposée pour enrichir le graphe LE_LA.",
            },
        )

        self.assertEqual(proposal_response.status_code, 200)
        proposal_id = proposal_response.json()["id"]

        with patch("app.services.proposal_service.evaluate_proposal_with_ai") as fake_ai:
            fake_ai.return_value.model_dump.return_value = {
                "global_score": 82,
                "grammar_score": 90,
                "clarity_score": 84,
                "completeness_score": 76,
                "editorial_value_score": 86,
                "relevance_score": 88,
                "duplicate_risk_score": 15,
                "source_quality_score": 64,
                "risk_score": 10,
                "content_type_recommendation": "new_card",
                "summary": "Contribution pertinente.",
                "strengths": [],
                "weaknesses": [],
                "grammar_suggestions": [],
                "content_suggestions": [],
                "missing_information": [],
                "duplicate_warnings": [],
                "suggested_existing_cards": [],
                "moderator_recommendation": "approve",
            }
            review_response = self.client.post(
                f"/api/contributions/proposals/{proposal_id}/ai-review",
                headers={"Authorization": f"Bearer {contributor_token}"},
            )

        self.assertEqual(review_response.status_code, 200)
        self.assertEqual(review_response.json()["status"], "ai_reviewed")

        submit_response = self.client.post(
            f"/api/contributions/proposals/{proposal_id}/submit",
            headers={"Authorization": f"Bearer {contributor_token}"},
        )
        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(submit_response.json()["status"], "pending_moderation")

        approve_response = self.client.post(
            f"/api/moderation/proposals/{proposal_id}/approve",
            headers={"Authorization": f"Bearer {moderator_token}"},
            json={"moderator_notes": "Validé pour publication."},
        )
        self.assertEqual(approve_response.status_code, 200)
        payload = approve_response.json()
        self.assertEqual(payload["status"], "approved")
        self.assertIsNotNone(payload["target_card_id"])

    def test_approved_fiche_is_public_and_fiche_correction_updates_section(self) -> None:
        contributor_login = self.client.post(
            "/api/auth/login",
            json={"email": "steve@lela.local", "password": "lela1234"},
        )
        moderator_login = self.client.post(
            "/api/auth/login",
            json={"email": "charles@lela.local", "password": "lela1234"},
        )
        contributor_token = contributor_login.json()["access_token"]
        moderator_token = moderator_login.json()["access_token"]

        fiche_response = self.client.post(
            "/api/contributions/proposals",
            headers={"Authorization": f"Bearer {contributor_token}"},
            json={
                "contribution_type": "create_fiche",
                "proposed_data": {
                    "card_reference": {
                        "id": "place-wurth",
                        "source": "editorial",
                        "title": "Musée Würth",
                        "short_description": "Carte existante",
                    },
                    "linked_editorial_id": "place-wurth",
                    "fiche": {
                        "title": "Fiche visite publique",
                        "sections": {
                            "resume": "Résumé initial de la fiche collaborative.",
                            "description": "Description détaillée de la proposition collaborative.",
                        },
                        "media_blocks": [],
                        "sources": [{"label": "Source", "url": "https://example.test"}],
                        "relations": [],
                        "tags": ["culture"],
                        "contributor_note": "Ajout d'une fiche détaillée.",
                    },
                },
                "explanation": "Ajout d'une fiche détaillée.",
            },
        )
        self.assertEqual(fiche_response.status_code, 200)
        fiche_proposal_id = fiche_response.json()["id"]

        with patch("app.services.proposal_service.evaluate_proposal_with_ai") as fake_ai:
            fake_ai.return_value.model_dump.return_value = {
                "global_score": 84,
                "grammar_score": 90,
                "clarity_score": 86,
                "completeness_score": 80,
                "editorial_value_score": 85,
                "relevance_score": 88,
                "duplicate_risk_score": 10,
                "source_quality_score": 70,
                "risk_score": 8,
                "content_type_recommendation": "existing_card_fiche",
                "summary": "Fiche pertinente.",
                "strengths": [],
                "weaknesses": [],
                "grammar_suggestions": [],
                "content_suggestions": [],
                "missing_information": [],
                "duplicate_warnings": [],
                "suggested_existing_cards": [],
                "moderator_recommendation": "approve",
            }
            self.client.post(
                f"/api/contributions/proposals/{fiche_proposal_id}/ai-review",
                headers={"Authorization": f"Bearer {contributor_token}"},
            )

        self.client.post(
            f"/api/contributions/proposals/{fiche_proposal_id}/submit",
            headers={"Authorization": f"Bearer {contributor_token}"},
        )
        approved_fiche_response = self.client.post(
            f"/api/moderation/proposals/{fiche_proposal_id}/approve",
            headers={"Authorization": f"Bearer {moderator_token}"},
            json={"moderator_notes": "Fiche validée."},
        )
        self.assertEqual(approved_fiche_response.status_code, 200)
        approved_fiche = approved_fiche_response.json()
        card_id = approved_fiche["target_card_id"]
        fiche_id = approved_fiche["target_fiche_id"]

        public_fiches_response = self.client.get("/api/cards/by-editorial/place-wurth/fiches")
        self.assertEqual(public_fiches_response.status_code, 200)
        public_fiches = public_fiches_response.json()
        self.assertEqual(len(public_fiches), 1)
        self.assertEqual(public_fiches[0]["sections"]["resume"], "Résumé initial de la fiche collaborative.")

        correction_response = self.client.post(
            "/api/contributions/proposals",
            headers={"Authorization": f"Bearer {contributor_token}"},
            json={
                "contribution_type": "correction",
                "target_card_id": card_id,
                "target_fiche_id": fiche_id,
                "proposed_data": {
                    "correction": {
                        "section": "Résumé",
                        "current_text": "Résumé initial de la fiche collaborative.",
                        "proposed_text": "Résumé corrigé et enrichi de la fiche collaborative.",
                        "explanation": "Correction de précision.",
                    }
                },
                "explanation": "Correction de précision.",
            },
        )
        self.assertEqual(correction_response.status_code, 200)
        correction_id = correction_response.json()["id"]

        with patch("app.services.proposal_service.evaluate_proposal_with_ai") as fake_ai:
            fake_ai.return_value.model_dump.return_value = {
                "global_score": 90,
                "grammar_score": 92,
                "clarity_score": 90,
                "completeness_score": 84,
                "editorial_value_score": 86,
                "relevance_score": 90,
                "duplicate_risk_score": 0,
                "source_quality_score": 70,
                "risk_score": 4,
                "content_type_recommendation": "correction",
                "summary": "Correction utile.",
                "strengths": [],
                "weaknesses": [],
                "grammar_suggestions": [],
                "content_suggestions": [],
                "missing_information": [],
                "duplicate_warnings": [],
                "suggested_existing_cards": [],
                "moderator_recommendation": "approve",
            }
            self.client.post(
                f"/api/contributions/proposals/{correction_id}/ai-review",
                headers={"Authorization": f"Bearer {contributor_token}"},
            )

        self.client.post(
            f"/api/contributions/proposals/{correction_id}/submit",
            headers={"Authorization": f"Bearer {contributor_token}"},
        )
        correction_approve_response = self.client.post(
            f"/api/moderation/proposals/{correction_id}/approve",
            headers={"Authorization": f"Bearer {moderator_token}"},
            json={"moderator_notes": "Correction validée."},
        )
        self.assertEqual(correction_approve_response.status_code, 200)

        corrected_fiches_response = self.client.get("/api/cards/by-editorial/place-wurth/fiches")
        self.assertEqual(corrected_fiches_response.status_code, 200)
        self.assertEqual(
            corrected_fiches_response.json()[0]["sections"]["resume"],
            "Résumé corrigé et enrichi de la fiche collaborative.",
        )


if __name__ == "__main__":
    unittest.main()
