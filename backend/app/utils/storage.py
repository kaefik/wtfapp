import os
import shutil
from uuid import uuid4
from pathlib import Path

from app.config import get_settings

settings = get_settings()


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def save_file(entity_type: str, entity_id: str, content: bytes, ext: str = "webp", is_thumbnail: bool = False) -> str:
    filename = f"thumb_{uuid4()}.{ext}" if is_thumbnail else f"{uuid4()}.{ext}"
    dir_path = os.path.join(settings.MEDIA_ROOT, entity_type, str(entity_id))
    _ensure_dir(dir_path)
    file_path = os.path.join(dir_path, filename)
    with open(file_path, "wb") as f:
        f.write(content)
    relative_path = os.path.join(entity_type, str(entity_id), filename)
    return relative_path


def delete_file(relative_path: str) -> None:
    file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
    if os.path.exists(file_path):
        os.remove(file_path)


def get_url(relative_path: str) -> str:
    return f"{settings.MEDIA_URL}{relative_path}"


def file_exists(relative_path: str) -> bool:
    file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
    return os.path.exists(file_path)
