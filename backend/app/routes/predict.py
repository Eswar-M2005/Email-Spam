"""
/api/predict — Email classification endpoint
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app.services.ml_pipeline import classify_email
from app.services.threat_engine import score_threat

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/", methods=["POST"])
def predict():
    data     = request.get_json(silent=True) or {}
    email    = data.get("email", "").strip()
    sender   = data.get("sender", "unknown@example.com")
    subject  = data.get("subject", "")
    has_att  = data.get("has_attachments", False)

    if not email:
        return jsonify({"error": "No email text provided."}), 400

    # ML classification
    ml_result = classify_email(email)

    # Threat scoring (rule-based layer on top)
    threat = score_threat(
        email_text    = email,
        sender        = sender,
        subject       = subject,
        spam_prob     = ml_result["raw_spam_prob"],
        has_attachments = has_att,
    )

    return jsonify({
        **ml_result,
        **threat,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sender":    sender,
        "subject":   subject,
    })
