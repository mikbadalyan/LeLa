from __future__ import annotations

from fastapi import APIRouter

from app.api import auth, cards, chat, contributions, editorial, feed, messages, moderation, social

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(feed.router)
api_router.include_router(editorial.router)
api_router.include_router(cards.router)
api_router.include_router(contributions.router)
api_router.include_router(chat.router)
api_router.include_router(social.router)
api_router.include_router(messages.router)
api_router.include_router(moderation.router)
