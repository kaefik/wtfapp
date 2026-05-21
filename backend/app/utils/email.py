import structlog
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib

from app.config import get_settings

logger = structlog.get_logger("app.email")
settings = get_settings()


async def send_email(to: str, subject: str, html_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=True,
        )
    except Exception as e:
        logger.warning("email_send_failed", to=to, error=str(e))


async def send_verification_email(to: str, token: str) -> None:
    verify_url = f"/verify-email?token={token}"
    html = f"""
    <html><body>
    <h2>Подтверждение email</h2>
    <p>Перейдите по ссылке для подтверждения:</p>
    <a href="{verify_url}">Подтвердить email</a>
    </body></html>
    """
    await send_email(to, "WTFApp — Подтверждение email", html)


async def send_password_reset_email(to: str, token: str) -> None:
    reset_url = f"/reset-password?token={token}"
    html = f"""
    <html><body>
    <h2>Сброс пароля</h2>
    <p>Перейдите по ссылке для сброса пароля:</p>
    <a href="{reset_url}">Сбросить пароль</a>
    <p>Ссылка действительна 1 час.</p>
    </body></html>
    """
    await send_email(to, "WTFApp — Сброс пароля", html)
