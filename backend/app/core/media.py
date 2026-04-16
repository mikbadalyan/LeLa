from __future__ import annotations

from pathlib import Path
from typing import Optional
from urllib.parse import quote

VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm"}
PLACE_COLLECTION_VIDEO = quote("lété-au-musée-würth.mp4", safe="/")
PLACE_COLLECTION_POSTER = quote("cards/five.png", safe="/")


def resolve_media_kind(media_url: str | None) -> str | None:
    if not media_url:
        return None

    suffix = Path(media_url).suffix.lower()
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".svg"}:
        return "image"
    return "unknown"


def resolve_poster_url(editorial_id: str, media_url: str | None) -> Optional[str]:
    if not media_url:
        return None

    if editorial_id == "place-collection" and PLACE_COLLECTION_VIDEO in media_url:
        return media_url.replace(PLACE_COLLECTION_VIDEO, PLACE_COLLECTION_POSTER)

    if resolve_media_kind(media_url) == "image":
        return media_url

    return None
