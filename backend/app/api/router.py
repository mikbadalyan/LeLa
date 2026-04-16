from __future__ import annotations

from fastapi import APIRouter

from app.api import auth, chat, contributions, editorial, feed, messages, social

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(feed.router)
api_router.include_router(editorial.router)
api_router.include_router(contributions.router)
api_router.include_router(chat.router)
api_router.include_router(social.router)
api_router.include_router(messages.router)
