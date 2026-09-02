"""Mailer service for sending transactional emails (OTP, notifications, alerts).
Supports Gmail SMTP (SSL on port 465 or STARTTLS on port 587) with HTML & plain-text fallbacks.
"""

import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import smtplib
import ssl

from app.core.config import get_settings

logger = logging.getLogger("uvicorn.error")
settings = get_settings()


def _build_otp_html(otp_code: str, full_name: str | None, purpose: str) -> str:
    """Generate clean, plain, and proper HTML email for OTP delivery."""
    greeting = f" {full_name.strip()}" if full_name and full_name.strip() else ""
    action_text = "sign in to" if purpose == "login" else "verify"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; line-height: 1.6;">
  <div style="max-width: 480px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
    
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #0f172a;">
      Your verification code
    </h2>
    
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
      Hello{greeting},
    </p>

    <p style="margin: 0 0 24px 0; font-size: 15px; color: #334155;">
      Use the following verification code to {action_text} your account:
    </p>

    <div style="background-color: #f1f5f9; border-radius: 6px; padding: 18px 24px; text-align: center; margin: 24px 0;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a; text-indent: 8px;">
        {otp_code}
      </div>
    </div>

    <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">
      This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.
    </p>

    <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b;">
      If you did not request this code, you can safely ignore this email.
    </p>

    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #94a3b8;">
      This is an automated message. Please do not reply to this email.
    </div>

  </div>
</body>
</html>"""


def _send_sync(to_email: str, subject: str, text_body: str, html_body: str) -> None:
    """Synchronous SMTP email delivery function."""
    if not settings.EMAIL_USER or not settings.EMAIL_PASS:
        logger.warning(
            "[MAILER] EMAIL_USER or EMAIL_PASS is not configured. Email to %s skipped.",
            to_email,
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_USER}>"
    msg["To"] = to_email

    # Attach both plain text and HTML versions
    part_text = MIMEText(text_body, "plain", "utf-8")
    part_html = MIMEText(html_body, "html", "utf-8")
    msg.attach(part_text)
    msg.attach(part_html)

    # Use SSL (Port 465) or STARTTLS (Port 587)
    context = ssl.create_default_context()

    if settings.SMTP_USE_SSL and settings.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=12) as server:
            server.login(settings.EMAIL_USER, settings.EMAIL_PASS)
            server.sendmail(settings.EMAIL_USER, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            server.starttls(context=context)
            server.login(settings.EMAIL_USER, settings.EMAIL_PASS)
            server.sendmail(settings.EMAIL_USER, [to_email], msg.as_string())

    logger.info("[MAILER] Verification email successfully delivered to %s", to_email)


async def send_otp_email(
    to_email: str,
    otp_code: str,
    full_name: str | None = None,
    purpose: str = "login",
) -> None:
    """Asynchronously dispatch OTP email via thread pool so FastAPI async loop is not blocked."""
    subject = f"{otp_code} is your verification code"
    greeting = f" {full_name.strip()}" if full_name and full_name.strip() else ""
    text_body = (
        f"Hello{greeting},\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
        f"If you did not request this code, you can safely ignore this email.\n"
    )
    html_body = _build_otp_html(otp_code, full_name, purpose)

    # Log in console for developer productivity / immediate inspection
    print(f"\n=======================================================")
    print(f"[AUTH OTP] Sent code '{otp_code}' to {to_email} (Purpose: {purpose})")
    print(f"=======================================================\n")

    try:
        await asyncio.to_thread(_send_sync, to_email, subject, text_body, html_body)
    except Exception as exc:
        logger.error("[MAILER ERROR] Failed to send email to %s: %s", to_email, exc)
        raise
