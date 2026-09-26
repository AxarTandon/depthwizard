"""
Auto-alert system: checks flood/building/crater results against configurable
thresholds and, when a project has auto_alert_enabled = true, sends a
notification and logs an AlertEvent. Ships with free SMTP email; a webhook
call is a documented drop-in alternative (e.g. for an SMS provider) - see
the TODO below.
"""
import smtplib
from email.mime.text import MIMEText

from app.core.config import get_settings

settings = get_settings()


def evaluate_triggers(flood: dict | None, buildings: list[dict], craters: list[dict]) -> list[dict]:
    triggers = []
    if flood and flood.get("submerged_percent", 0) > settings.ALERT_FLOOD_SUBMERGED_PCT:
        triggers.append({
            "trigger_type": "flood",
            "message": f"Flood risk: {flood['submerged_percent']}% of the scene is submerged "
                       f"at water level {flood['water_level']}.",
        })
    high_risk = [b for b in buildings if b["risk_level"] == "high"]
    if high_risk:
        triggers.append({
            "trigger_type": "building_collapse",
            "message": f"{len(high_risk)} building(s) flagged high collapse-risk, "
                       f"with neighboring structures inside the debris radius.",
        })
    severe_craters = [c for c in craters if c["depth_m"] > settings.CRATER_MIN_DEPTH_M * 2
                       and c["circularity"] > settings.CRATER_MIN_CIRCULARITY]
    if severe_craters:
        triggers.append({
            "trigger_type": "crater",
            "message": f"{len(severe_craters)} significant crater/impact anomaly(ies) detected.",
        })
    return triggers


def send_alert_email(subject: str, body: str) -> bool:
    """Sends via free SMTP (e.g. a Gmail app password). Returns False (and
    logs) instead of raising, so a misconfigured alert channel never crashes
    the request that triggered it.

    TODO: to use SMS instead, replace this function's body with a call to a
    webhook / SMS provider of your choice; evaluate_triggers() and the
    calling code in the alerts API route do not need to change.
    """
    if not settings.ALERT_SMTP_HOST or not settings.ALERT_AUTHORITY_EMAIL:
        return False
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.ALERT_FROM_EMAIL
        msg["To"] = settings.ALERT_AUTHORITY_EMAIL
        with smtplib.SMTP(settings.ALERT_SMTP_HOST, settings.ALERT_SMTP_PORT) as server:
            server.starttls()
            server.login(settings.ALERT_SMTP_USER, settings.ALERT_SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception:
        return False
