from __future__ import annotations

import json
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.contribution import ContributionFicheBase, ContributionProposalCreate, FicheAiEvaluation


def _default_evaluation(summary: str) -> FicheAiEvaluation:
    return FicheAiEvaluation(
        global_score=0,
        grammar_score=0,
        clarity_score=0,
        completeness_score=0,
        editorial_value_score=0,
        relevance_score=0,
        risk_score=50,
        summary=summary,
        weaknesses=["Analyse IA indisponible ou incomplete."],
        missing_information=["Verification humaine requise."],
        moderator_recommendation="manual_review",
    )


def _extract_json(raw_text: str) -> dict[str, Any]:
    text = raw_text.strip()
    if not text:
        raise ValueError("Reponse IA vide.")

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("La reponse IA ne contient pas de JSON.")

    parsed = json.loads(text[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("La reponse IA JSON n'est pas un objet.")
    return parsed


def _build_prompt(fiche: ContributionFicheBase) -> str:
    fiche_payload = fiche.model_dump()
    return f"""
Tu es l'assistant de moderation editoriale de LE_LA.
LE_LA est une plateforme de decouverte editoriale reliant lieux, personnes,
evenements et capsules culturelles dans un graphe de contenus.

Analyse la fiche suivante pour aider un moderateur humain. Tu n'approuves jamais
automatiquement. Reponds uniquement avec un JSON valide, sans markdown.

Format JSON obligatoire:
{{
  "global_score": 0,
  "grammar_score": 0,
  "clarity_score": 0,
  "completeness_score": 0,
  "editorial_value_score": 0,
  "relevance_score": 0,
  "risk_score": 0,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "grammar_suggestions": [],
  "content_suggestions": [],
  "missing_information": [],
  "moderator_recommendation": "approve | needs_changes | reject | manual_review"
}}

Contraintes:
- Scores entre 0 et 100.
- risk_score: 0 signifie risque faible, 100 signifie risque fort.
- moderator_recommendation doit etre l'une des 4 valeurs autorisees.
- Signale les problemes de grammaire, de clarte, de sources, de factualite,
  de contenu faible ou inapproprie.
- Reste concis et utile pour un moderateur francophone.

Fiche a evaluer:
{json.dumps(fiche_payload, ensure_ascii=False, indent=2)}
""".strip()


def _build_proposal_prompt(
    proposal: ContributionProposalCreate,
    similar_cards: list[dict[str, Any]],
) -> str:
    proposal_payload = proposal.model_dump()
    return f"""
Tu es l'assistant de moderation editoriale de LE_LA.
LE_LA utilise maintenant deux objets principaux:
- Card / Carte: apercu public compact d'une entite.
- Fiche: contenu editorial detaille rattache a une carte.

Les contributeurs peuvent creer une nouvelle carte, ajouter ou completer une
fiche existante, ou proposer une correction. Tu aides uniquement le moderateur
humain. Tu ne publies jamais et tu n'approuves jamais automatiquement.

Analyse la proposition ci-dessous et decide notamment:
- Est-ce vraiment une nouvelle carte?
- Le contenu devrait-il plutot completer une carte existante?
- Y a-t-il un risque de doublon?
- La proposition est-elle claire, utile, sourcée et adaptee a LE_LA?
- Que doit verifier le moderateur?

Reponds uniquement avec un JSON valide, sans markdown.

Format JSON obligatoire:
{{
  "global_score": 0,
  "grammar_score": 0,
  "clarity_score": 0,
  "completeness_score": 0,
  "editorial_value_score": 0,
  "relevance_score": 0,
  "duplicate_risk_score": 0,
  "source_quality_score": 0,
  "risk_score": 0,
  "content_type_recommendation": "new_card | existing_card_fiche | correction | manual_review",
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "grammar_suggestions": [],
  "content_suggestions": [],
  "missing_information": [],
  "duplicate_warnings": [],
  "suggested_existing_cards": [],
  "moderator_recommendation": "approve | needs_changes | reject | manual_review"
}}

Contraintes:
- Scores entre 0 et 100.
- duplicate_risk_score: 0 signifie aucun doublon probable, 100 signifie doublon probable.
- risk_score: 0 signifie risque faible, 100 signifie risque fort.
- Signale la factualite fragile, les sources faibles, la tonalite inadaptee,
  les manques, les risques de doublon et les corrections utiles.
- Reste concis, francophone, et actionnable pour un moderateur.

Cartes similaires detectees:
{json.dumps(similar_cards, ensure_ascii=False, indent=2)}

Proposition a evaluer:
{json.dumps(proposal_payload, ensure_ascii=False, indent=2)}
""".strip()


def evaluate_fiche_with_ai(fiche: ContributionFicheBase) -> FicheAiEvaluation:
    settings = get_settings()
    prompt = _build_prompt(fiche)
    request_payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }
    request = Request(
        f"{settings.ollama_base_url.rstrip('/')}/api/generate",
        data=json.dumps(request_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=settings.llm_timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, json.JSONDecodeError) as error:
        return _default_evaluation(
            f"Analyse IA indisponible: {error}. Le moderateur doit relire manuellement."
        )

    raw_response = str(payload.get("response", ""))
    try:
        parsed = _extract_json(raw_response)
        return FicheAiEvaluation.model_validate(parsed)
    except (ValueError, json.JSONDecodeError, ValidationError) as error:
        return _default_evaluation(
            f"Reponse IA invalide: {error}. Le moderateur doit relire manuellement."
        )


def evaluate_proposal_with_ai(
    proposal: ContributionProposalCreate,
    similar_cards: list[dict[str, Any]] | None = None,
) -> FicheAiEvaluation:
    settings = get_settings()
    prompt = _build_proposal_prompt(proposal, similar_cards or [])
    request_payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }
    request = Request(
        f"{settings.ollama_base_url.rstrip('/')}/api/generate",
        data=json.dumps(request_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=settings.llm_timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, json.JSONDecodeError) as error:
        return _default_evaluation(
            f"Analyse IA indisponible: {error}. Le moderateur doit relire manuellement."
        )

    raw_response = str(payload.get("response", ""))
    try:
        parsed = _extract_json(raw_response)
        return FicheAiEvaluation.model_validate(parsed)
    except (ValueError, json.JSONDecodeError, ValidationError) as error:
        return _default_evaluation(
            f"Reponse IA invalide: {error}. Le moderateur doit relire manuellement."
        )
