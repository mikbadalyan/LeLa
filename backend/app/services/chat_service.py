from __future__ import annotations

import unicodedata
from typing import Any, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.chat_feedback import ChatFeedback
from app.models.editorial import EditorialObject, EditorialType
from app.models.user import User
from app.schemas.chat import (
    ChatFeedbackCreate,
    ChatFeedbackRead,
    ChatEditorialSuggestion,
    ChatRequest,
    ChatResponse,
    ChatRouteSuggestion,
)
from app.services.editorial_service import LOAD_OPTIONS, _resolve_media_kind, _resolve_poster_url

TYPE_ROUTE_MAP = {
    EditorialType.PLACE: "/feed?focus=place",
    EditorialType.PERSON: "/feed?focus=person",
    EditorialType.EVENT: "/feed?focus=event",
}

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

STATIC_FOLLOW_UPS = [
    "Montre-moi des lieux a explorer sur LE_LA.",
    "Quels evenements sont lies a cette carte ?",
    "Ou puis-je contribuer un nouveau contenu ?",
]
MIN_EDITORIAL_MATCH_SCORE = 2


def _normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(character for character in normalized if not unicodedata.combining(character)).lower()


def _question_tokens(question: str) -> list[str]:
    tokens = []
    for raw_token in _normalize(question).replace("/", " ").replace("?", " ").split():
        token = raw_token.strip(".,:;!()[]{}\"'")
        if len(token) >= 3:
            tokens.append(token)
    return tokens


def _editorial_text(item: EditorialObject) -> str:
    parts = [
        item.title,
        item.subtitle or "",
        item.description,
        item.narrative_text,
    ]

    if item.place:
        parts.extend([item.place.address, item.place.city, item.place.opening_hours or ""])

    if item.person:
        parts.extend([item.person.name, item.person.role, item.person.biography])

    if item.event:
        if item.event.location:
            parts.extend([item.event.location.title, item.event.location.subtitle or ""])
        if item.event.price is not None:
            parts.append(str(item.event.price))

    return _normalize(" ".join(parts))


def _type_hint_score(item: EditorialObject, normalized_question: str) -> int:
    score = 0

    if item.type == EditorialType.PLACE and any(
        keyword in normalized_question
        for keyword in ("lieu", "visiter", "musee", "adresse", "ou", "place")
    ):
        score += 2

    if item.type == EditorialType.PERSON and any(
        keyword in normalized_question
        for keyword in ("personne", "acteur", "artiste", "auteur", "illustrateur", "dessinateur")
    ):
        score += 2

    if item.type == EditorialType.EVENT and any(
        keyword in normalized_question
        for keyword in ("evenement", "agenda", "spectacle", "date", "sortir", "quand")
    ):
        score += 2

    return score


def _score_editorial(item: EditorialObject, question: str, question_tokens: list[str]) -> int:
    normalized_question = _normalize(question)
    haystack = _editorial_text(item)
    title = _normalize(item.title)
    subtitle = _normalize(item.subtitle or "")
    score = _type_hint_score(item, normalized_question)

    for token in question_tokens:
        if token in title:
            score += 5
        elif token in subtitle:
            score += 3
        elif token in haystack:
            score += 1

    return score


def _serialize_editorial_suggestion(item: EditorialObject) -> ChatEditorialSuggestion:
    return ChatEditorialSuggestion(
        id=item.id,
        type=item.type,
        title=item.title,
        subtitle=item.subtitle,
        description=item.description,
        media_url=item.media_url,
        media_kind=_resolve_media_kind(item.media_url),
        poster_url=_resolve_poster_url(item),
        href=f"/editorial/{item.id}",
    )


def _search_editorials(db: Session, question: str, limit: int = 3) -> list[ChatEditorialSuggestion]:
    items = db.scalars(
        select(EditorialObject).options(*LOAD_OPTIONS).order_by(EditorialObject.created_at.desc())
    ).all()
    question_tokens = _question_tokens(question)

    scored = [(item, _score_editorial(item, question, question_tokens)) for item in items]
    scored.sort(key=lambda entry: (entry[1], entry[0].created_at), reverse=True)

    matches = [item for item, score in scored if score >= MIN_EDITORIAL_MATCH_SCORE][:limit]
    return [_serialize_editorial_suggestion(item) for item in matches]


def _route_suggestions(
    question: str,
    suggestions: list[ChatEditorialSuggestion],
    current_user: Optional[User],
) -> list[ChatRouteSuggestion]:
    normalized_question = _normalize(question)
    routes: list[ChatRouteSuggestion] = []

    def add_route(label: str, href: str, reason: str) -> None:
        if any(existing.href == href for existing in routes):
            return
        routes.append(ChatRouteSuggestion(label=label, href=href, reason=reason))

    add_route("Fil editorial", "/feed", "Revenir au fil principal et explorer toutes les cartes.")

    if any(keyword in normalized_question for keyword in ("lieu", "visiter", "musee", "adresse")):
        add_route("Lieux", "/feed?focus=place", "Ouvrir la vue dediee aux lieux.")

    if any(keyword in normalized_question for keyword in ("personne", "acteur", "artiste", "auteur")):
        add_route("Acteurs", "/feed?focus=person", "Explorer les personnes et profils editoriaux.")

    if any(keyword in normalized_question for keyword in ("evenement", "agenda", "spectacle", "quand", "sortir")):
        add_route("Evenements", "/feed?focus=event", "Voir les evenements disponibles dans le fil.")

    if any(keyword in normalized_question for keyword in ("contribuer", "ajouter", "publier", "soumettre")):
        add_route("Contributions", "/contribute", "Proposer un nouveau contenu dans LE_LA.")

    if any(keyword in normalized_question for keyword in ("compte", "profil", "connexion", "login")):
        add_route("Compte", "/profile" if current_user else "/login", "Acceder a votre espace utilisateur.")

    for suggestion in suggestions[:2]:
        type_label = (
            "Lieux"
            if suggestion.type == EditorialType.PLACE
            else "Acteurs"
            if suggestion.type == EditorialType.PERSON
            else "Evenements"
        )
        add_route(
            type_label,
            TYPE_ROUTE_MAP[suggestion.type],
            f"Explorer d'autres cartes similaires a {suggestion.title}.",
        )

    return routes[:4]


def _follow_up_questions(suggestions: list[ChatEditorialSuggestion]) -> list[str]:
    questions = list(STATIC_FOLLOW_UPS)

    for suggestion in suggestions[:2]:
        if suggestion.type == EditorialType.PLACE:
            questions.insert(0, f"Qu'y a-t-il a voir autour de {suggestion.title} ?")
        elif suggestion.type == EditorialType.PERSON:
            questions.insert(0, f"Quelles cartes sont liees a {suggestion.title} ?")
        else:
            questions.insert(0, f"Y a-t-il d'autres evenements comme {suggestion.title} ?")

    deduped: list[str] = []
    for question in questions:
        if question not in deduped:
            deduped.append(question)

    return deduped[:3]


def _latest_catalog_context(db: Session) -> str:
    items = db.scalars(
        select(EditorialObject).options(*LOAD_OPTIONS).order_by(EditorialObject.created_at.desc()).limit(6)
    ).all()

    lines = []
    for item in items:
        lines.append(
            f"- {item.title} [{item.type.value}] | sous-titre: {item.subtitle or 'aucun'} | "
            f"resume: {item.description} | fiche: /editorial/{item.id}"
        )
    return "\n".join(lines)


def _navigation_context() -> str:
    return "\n".join(
        [
            "- /feed : fil editorial principal",
            "- /feed?focus=place : cartes de lieux",
            "- /feed?focus=person : cartes d'acteurs",
            "- /feed?focus=event : cartes d'evenements",
            "- /feed?focus=chat : assistant LE_LA Chat",
            "- /contribute : proposer une contribution",
            "- /profile : voir le compte utilisateur",
            "- /login : connexion et inscription",
        ]
    )


def _build_system_prompt(
    payload: ChatRequest,
    current_user: Optional[User],
    related_editorials: list[ChatEditorialSuggestion],
    catalog_context: str,
) -> str:
    user_context = (
        f"Utilisateur connecte: {current_user.username} | ville: {current_user.city or 'non renseignee'}"
        if current_user
        else "Utilisateur visiteur non connecte."
    )

    related_context = "\n".join(
        [
            f"- {entry.title} [{entry.type.value}] | sous-titre: {entry.subtitle or 'aucun'} | "
            f"resume: {entry.description} | fiche: {entry.href}"
            for entry in related_editorials
        ]
    )

    return (
        "Tu es LE_LA Chat, l'assistant IA integre a la plateforme LE_LA. "
        "Tu aides l'utilisateur a naviguer dans la PWA, trouver des lieux, personnes et evenements editoriaux, "
        "et reponds toujours en francais, avec un ton chaleureux, concret et concis. "
        "Si une information n'existe pas dans le contexte LE_LA, dis-le franchement et propose le meilleur ecran "
        "a ouvrir ensuite. N'invente jamais de cartes, d'adresses ou d'evenements absents du contexte. "
        "Quand tu cites une carte, utilise son titre exact. Si aucune carte ne correspond clairement, reponds "
        "uniquement avec du texte et ne forces pas de suggestion editoriale.\n\n"
        f"Page courante: {payload.current_path or '/feed?focus=chat'}\n"
        f"Focus courant: {payload.current_focus or 'chat'}\n"
        f"{user_context}\n\n"
        f"Routes LE_LA disponibles:\n{_navigation_context()}\n\n"
        f"Cartes editoriales les plus pertinentes pour cette question:\n{related_context or '- aucune'}\n\n"
        f"Apercu du catalogue recent LE_LA:\n{catalog_context}\n"
    )


def _conversation_messages(
    payload: ChatRequest,
    current_user: Optional[User],
    related_editorials: list[ChatEditorialSuggestion],
    catalog_context: str,
) -> list[dict[str, str]]:
    messages = [
        {
            "role": "system",
            "content": _build_system_prompt(payload, current_user, related_editorials, catalog_context),
        }
    ]

    for entry in payload.history:
        messages.append({"role": entry.role, "content": entry.content})

    messages.append({"role": "user", "content": payload.message})
    return messages


def _extract_content(data: dict[str, Any]) -> tuple[str, Optional[str]]:
    choices = data.get("choices") or []
    if not choices:
        return "", data.get("id")

    message = choices[0].get("message") or {}
    content = message.get("content", "")

    if isinstance(content, list):
        text_parts = [
            entry.get("text", "")
            for entry in content
            if isinstance(entry, dict) and entry.get("type") == "text"
        ]
        return "\n".join(part for part in text_parts if part).strip(), data.get("id")

    return str(content).strip(), data.get("id")


def _post_chat_completion(
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    timeout: float,
) -> dict[str, Any]:
    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as error:
        detail = error.response.text[:300]
        raise RuntimeError(f"Le fournisseur IA a refuse la requete: {detail}") from error
    except httpx.HTTPError as error:
        if "localhost:11434" in url or "127.0.0.1:11434" in url:
            raise RuntimeError(
                "LE_LA Chat n'a pas trouve Ollama. Installez Ollama, lancez `ollama serve`, puis `ollama pull mistral`."
            ) from error
        raise RuntimeError(
            "LE_LA Chat n'a pas pu joindre le modele configure pour le moment."
        ) from error


def _request_provider_completion(settings, messages: list[dict[str, str]]) -> tuple[str, Optional[str]]:
    provider = settings.llm_provider.lower().strip()

    if provider == "mistral":
        if not settings.mistral_api_key:
            raise RuntimeError(
                "MISTRAL_API_KEY est manquant. Ajoutez une cle Mistral gratuite ou passez LLM_PROVIDER=ollama."
            )

        data = _post_chat_completion(
            MISTRAL_API_URL,
            {
                "Authorization": f"Bearer {settings.mistral_api_key}",
                "Content-Type": "application/json",
            },
            {
                "model": settings.mistral_model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 420,
            },
            settings.llm_timeout_seconds,
        )
        return _extract_content(data)

    if provider == "ollama":
        base_url = settings.ollama_base_url.rstrip("/")
        data = _post_chat_completion(
            f"{base_url}/v1/chat/completions",
            {"Content-Type": "application/json"},
            {
                "model": settings.ollama_model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 420,
            },
            settings.llm_timeout_seconds,
        )
        return _extract_content(data)

    raise RuntimeError(
        "LLM_PROVIDER doit etre 'ollama' ou 'mistral'."
    )


def respond_to_chat(
    db: Session,
    payload: ChatRequest,
    current_user: Optional[User] = None,
) -> ChatResponse:
    settings = get_settings()
    query_text = " ".join(
        [
            *(entry.content for entry in payload.history if entry.role == "user"),
            payload.message,
        ]
    )
    related_editorials = _search_editorials(db, query_text)
    suggested_routes = _route_suggestions(payload.message, related_editorials, current_user)
    catalog_context = _latest_catalog_context(db)
    conversation = _conversation_messages(
        payload, current_user, related_editorials, catalog_context
    )
    message, response_id = _request_provider_completion(settings, conversation)

    if not message:
        message = (
            "Je suis pret a vous guider dans LE_LA, mais le modele n'a pas renvoye de texte exploitable."
        )

    return ChatResponse(
        message=message,
        response_id=response_id,
        suggested_routes=suggested_routes,
        suggested_editorials=related_editorials,
        follow_up_questions=_follow_up_questions(related_editorials),
    )


def save_chat_feedback(
    db: Session,
    payload: ChatFeedbackCreate,
    current_user: Optional[User] = None,
) -> ChatFeedbackRead:
    existing = db.scalar(select(ChatFeedback).where(ChatFeedback.message_id == payload.message_id))

    if existing:
        existing.rating = payload.rating
        existing.response_text = payload.response_text
        existing.conversation_id = payload.conversation_id
        if current_user:
            existing.user_id = current_user.id
        feedback = existing
    else:
        feedback = ChatFeedback(
            conversation_id=payload.conversation_id,
            message_id=payload.message_id,
            rating=payload.rating,
            response_text=payload.response_text,
            user_id=current_user.id if current_user else None,
        )
        db.add(feedback)

    db.commit()
    db.refresh(feedback)

    return ChatFeedbackRead(
        id=feedback.id,
        conversation_id=feedback.conversation_id,
        message_id=feedback.message_id,
        rating=feedback.rating,
    )
