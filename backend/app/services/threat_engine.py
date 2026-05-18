"""
Threat Scoring Engine
Combines ML probability with rule-based heuristics.
"""

import re
from app.utils.preprocessor import extract_urls, has_url_shortener, count_phishing_keywords


SUSPICIOUS_DOMAINS = {
    "tempmail", "guerrillamail", "mailinator", "throwam", "yopmail",
    "trashmail", "fakeinbox", "dispostable"
}

URGENCY_PATTERNS = [
    r"act now", r"limited time", r"expires? (today|soon|immediately)",
    r"respond immediately", r"don'?t (delay|wait|ignore)",
    r"(last|final) (chance|warning|notice)", r"within \d+ (hours?|days?)",
]


def score_threat(
    email_text: str,
    sender: str,
    subject: str,
    spam_prob: float,
    has_attachments: bool = False,
) -> dict:
    """
    Calculate a composite threat score (0-100) and generate threat details.

    Returns:
        {
            threat_score: int (0–100),
            threat_level: str ("safe" | "low" | "medium" | "high" | "critical"),
            threat_type:  str,
            factors:      list[str],
            recommendation: str,
        }
    """
    score = 0
    factors = []

    # ── ML probability contribution (max 50 pts) ──────────────────────────────
    ml_pts = int(spam_prob * 50)
    score += ml_pts
    if spam_prob > 0.7:
        factors.append("Machine learning model flagged high spam probability")

    # ── URL analysis (max 20 pts) ─────────────────────────────────────────────
    urls = extract_urls(email_text)
    if urls:
        score += 5
        factors.append(f"Contains {len(urls)} external URL(s)")
        if has_url_shortener(urls):
            score += 10
            factors.append("Uses URL shortening service (common in phishing)")
        if len(urls) > 3:
            score += 5
            factors.append("Excessive number of links")

    # ── Phishing keywords (max 15 pts) ────────────────────────────────────────
    kw_count = count_phishing_keywords(email_text + " " + subject)
    if kw_count > 0:
        kw_pts = min(kw_count * 3, 15)
        score += kw_pts
        factors.append(f"Contains {kw_count} phishing-related keyword(s)")

    # ── Urgency language (max 10 pts) ─────────────────────────────────────────
    combined = (email_text + " " + subject).lower()
    urgency_hits = sum(1 for p in URGENCY_PATTERNS if re.search(p, combined))
    if urgency_hits:
        score += min(urgency_hits * 5, 10)
        factors.append("Uses urgent/pressure language")

    # ── Suspicious sender domain (5 pts) ─────────────────────────────────────
    sender_lower = sender.lower()
    if any(d in sender_lower for d in SUSPICIOUS_DOMAINS):
        score += 5
        factors.append("Sender uses a suspicious/disposable email domain")

    # ── Attachments (5 pts) ───────────────────────────────────────────────────
    if has_attachments:
        score += 5
        factors.append("Email contains attachment(s)")

    # ── Cap and classify ──────────────────────────────────────────────────────
    score = min(score, 100)

    if score >= 80:
        level = "critical"
        threat_type = "Phishing / Scam"
        recommendation = "Do not click any links. Mark as phishing and delete immediately."
    elif score >= 60:
        level = "high"
        threat_type = "Spam / Suspicious"
        recommendation = "Avoid interacting. Move to spam folder."
    elif score >= 40:
        level = "medium"
        threat_type = "Potential Spam"
        recommendation = "Verify sender identity before responding."
    elif score >= 20:
        level = "low"
        threat_type = "Low Risk"
        recommendation = "Email appears mostly safe. Exercise normal caution."
    else:
        level = "safe"
        threat_type = "Clean"
        recommendation = "Email appears legitimate."

    return {
        "threat_score":    score,
        "threat_level":    level,
        "threat_type":     threat_type,
        "factors":         factors if factors else ["No significant threat indicators found"],
        "recommendation":  recommendation,
    }
