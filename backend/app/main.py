from __future__ import annotations

from contextlib import asynccontextmanager
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    with SessionLocal() as session:
        init_db(session)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_origin_regex=settings.frontend_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "LE_LA API is running."}
