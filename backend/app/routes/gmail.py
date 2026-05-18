"""
/api/gmail — Gmail OAuth flow + email scanning
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, redirect, session, g
from app.routes.auth import require_auth
from app.services import gmail_service, firebase_service, ml_pipeline, threat_engine, openai_service

gmail_bp = Blueprint("gmail", __name__)


@gmail_bp.route("/connect")
@require_auth
def connect():
    """Start Gmail OAuth2 flow."""
    url, state = gmail_service.get_authorization_url()
    session["oauth_state"] = state
    session["uid"]         = g.uid
    return jsonify({"auth_url": url})


@gmail_bp.route("/callback")
def callback():
    """Handle Gmail OAuth2 callback."""
    code  = request.args.get("code")
    uid   = session.get("uid")

    if not code or not uid:
        return redirect("/#/settings?gmail=error")

    try:
        tokens = gmail_service.exchange_code_for_tokens(code)
        firebase_service.save_gmail_tokens(uid, tokens)
        return redirect("/#/settings?gmail=connected")
    except Exception as e:
        return redirect("/#/settings?gmail=error")


@gmail_bp.route("/status")
@require_auth
def status():
    """Check if Gmail is connected for this user."""
    tokens = firebase_service.get_gmail_tokens(g.uid)
    return jsonify({"connected": tokens is not None})


@gmail_bp.route("/scan", methods=["POST"])
@require_auth
def scan():
    """Fetch and classify recent Gmail inbox emails."""
    tokens = firebase_service.get_gmail_tokens(g.uid)
    if tokens is None:
        return jsonify({"error": "Gmail not connected"}), 400

    data        = request.get_json(silent=True) or {}
    max_results = min(int(data.get("max_results", 10)), 25)

    emails   = gmail_service.fetch_recent_emails(tokens, max_results)
    results  = []

    for email in emails:
        text    = f"{email['subject']} {email['body']}"
        ml      = ml_pipeline.classify_email(text)
        threat  = threat_engine.score_threat(
            email_text     = text,
            sender         = email["sender"],
            subject        = email["subject"],
            spam_prob      = ml["raw_spam_prob"],
            has_attachments= email["has_attachments"],
        )

        classified = {
            **email,
            **ml,
            **threat,
            "uid":       g.uid,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Persist to Firestore
        doc_id = firebase_service.save_email_result(g.uid, classified)
        classified["doc_id"] = doc_id
        results.append(classified)

    return jsonify({"scanned": len(results), "results": results})


@gmail_bp.route("/history")
@require_auth
def history():
    """Return previously scanned email history from Firestore."""
    limit   = int(request.args.get("limit", 20))
    history = firebase_service.get_email_history(g.uid, limit)
    return jsonify({"emails": history})
