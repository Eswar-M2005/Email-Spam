"""
/api/ai — OpenAI-powered email insights
"""

from flask import Blueprint, request, jsonify, g
from app.routes.auth import require_auth
from app.services.openai_service import generate_threat_explanation, summarize_email

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/explain", methods=["POST"])
def explain():
    """Generate AI threat explanation (no auth required — works in demo mode)."""
    data = request.get_json(silent=True) or {}
    explanation = generate_threat_explanation(
        subject      = data.get("subject", ""),
        sender       = data.get("sender", ""),
        snippet      = data.get("snippet", ""),
        threat_level = data.get("threat_level", "medium"),
        threat_type  = data.get("threat_type", "Spam"),
        factors      = data.get("factors", []),
    )
    return jsonify({"explanation": explanation})


@ai_bp.route("/summarize", methods=["POST"])
def summarize():
    """Generate a brief AI email summary."""
    data    = request.get_json(silent=True) or {}
    subject = data.get("subject", "")
    body    = data.get("body", "")

    if not body:
        return jsonify({"error": "No email body provided"}), 400

    summary = summarize_email(subject, body)
    return jsonify({"summary": summary})
