from io import BytesIO

from PIL import Image

MAX_SIZE = 5 * 1024 * 1024

JPEG_MAGIC = b'\xff\xd8\xff'
PNG_MAGIC = b'\x89PNG'
WEBP_MAGIC_RIFF = b'RIFF'
WEBP_MAGIC_WEBP = b'WEBP'

ALLOWED_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/webp'}


def validate_image(content: bytes, content_type: str) -> None:
    if len(content) > MAX_SIZE:
        raise ValueError(f'Image size {len(content)} exceeds maximum allowed size {MAX_SIZE} bytes')

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f'Unsupported content type: {content_type}. Allowed: {ALLOWED_CONTENT_TYPES}')

    if content.startswith(JPEG_MAGIC):
        return
    if content.startswith(PNG_MAGIC):
        return
    if content.startswith(WEBP_MAGIC_RIFF) and len(content) > 12 and content[8:12] == WEBP_MAGIC_WEBP:
        return

    raise ValueError('Image format could not be verified by magic bytes')


def convert_to_webp(image_data: bytes) -> bytes:
    img = Image.open(BytesIO(image_data))
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    buf = BytesIO()
    img.save(buf, format='WEBP', quality=85)
    return buf.getvalue()


def resize_if_needed(image_data: bytes, max_dim: int = 1920) -> bytes:
    img = Image.open(BytesIO(image_data))
    w, h = img.size
    if w <= max_dim and h <= max_dim:
        return image_data
    ratio = min(max_dim / w, max_dim / h)
    new_w = int(w * ratio)
    new_h = int(h * ratio)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    buf = BytesIO()
    fmt = img.format or 'WEBP'
    img.save(buf, format=fmt)
    return buf.getvalue()


def generate_thumbnail(image_data: bytes, width: int = 300, height: int = 200) -> bytes:
    img = Image.open(BytesIO(image_data))
    img.thumbnail((width, height), Image.LANCZOS)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    buf = BytesIO()
    img.save(buf, format='WEBP', quality=75)
    return buf.getvalue()


def process_upload(content: bytes, content_type: str) -> tuple[bytes, bytes]:
    validate_image(content, content_type)
    resized = resize_if_needed(content)
    webp = convert_to_webp(resized)
    thumbnail = generate_thumbnail(resized)
    return webp, thumbnail
