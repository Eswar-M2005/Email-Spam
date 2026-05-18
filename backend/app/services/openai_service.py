"""
OpenAI Service — AI-powered email analysis and summaries
"""

import os
from openai import OpenAI

_client = None


def get_client() -> OpenAI | None:
    global _client
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return None
    if _client is None:
        _client = OpenAI(api_key=api_key)
    return _client


def generate_threat_explanation(
    subject: str,
    sender: str,
    snippet: str,
    threat_level: str,
    threat_type: str,
    factors: list[str],
) -> str:
    """
    Generate a natural-language explanation of why an email was flagged.
    Falls back to a template-based explanation if OpenAI is not configured.
    """
    client = get_client()

    if client is None:
        # Template fallback — no API key needed
        return _template_explanation(threat_level, threat_type, factors)

    factor_list = "\n".join(f"- {f}" for f in factors)
    prompt = f"""You are a cybersecurity AI assistant. Analyze this email threat assessment and write a clear, 
concise 2-3 sentence explanation for a non-technical user.

Email details:
- Subject: {subject}
- Sender: {sender}  
- Preview: {snippet[:200]}
- Threat Level: {threat_level.upper()}
- Threat Type: {threat_type}
- Risk Factors Detected:
{factor_list}

Write a plain-English explanation of why this email is {threat_level} risk and what the user should do."""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return _template_explanation(threat_level, threat_type, factors)


def summarize_email(subject: str, body: str) -> str:
    """Generate a one-paragraph AI summary of an email."""
    client = get_client()
    if client is None:
        return f"Email: {subject}. {body[:150]}..."

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user",
                "content": f"Summarize this email in 1-2 sentences:\n\nSubject: {subject}\n\n{body[:1000]}"
            }],
            max_tokens=100,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return f"{subject}: {body[:150]}..."


def _template_explanation(threat_level: str, threat_type: str, factors: list[str]) -> str:
    """Rule-based fallback explanation when OpenAI is not available."""
    if threat_level in ("critical", "high"):
        return (
            f"This email has been classified as {threat_type} with a HIGH risk score. "
            f"Key indicators include: {', '.join(factors[:3])}. "
            "Do not click any links or provide personal information."
        )
    elif threat_level == "medium":
        return (
            f"This email shows some suspicious characteristics ({', '.join(factors[:2])}). "
            "Verify the sender's identity before responding or clicking any links."
        )
    else:
        return "This email appears to be legitimate based on our analysis. No significant threat indicators were found."
