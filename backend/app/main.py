from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.db.init_db import init_db
from app.db.session import SessionLocal

settings = get_settings()

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title=settings.app_name)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_origin_regex=settings.frontend_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# IMPORTANT FIX: ensure frontend /api/* works
API_PREFIX = "/api"
app.include_router(api_router, prefix=API_PREFIX)


# Startup DB init
@app.on_event("startup")
def on_startup() -> None:
    with SessionLocal() as session:
        init_db(session)


# Health check
@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "LE_LA API is running."}
