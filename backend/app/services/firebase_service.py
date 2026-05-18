"""
Firebase Admin SDK service — Firestore operations
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from flask import current_app

_db = None


def _init_firebase():
    global _db
    if not firebase_admin._apps:
        project_id   = os.getenv("FIREBASE_PROJECT_ID", "")
        private_key  = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL", "")

        if project_id and private_key and client_email:
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            })
            firebase_admin.initialize_app(cred)
        else:
            # Demo mode — no Firebase credentials provided
            return None

    _db = firestore.client()
    return _db


def get_db():
    global _db
    if _db is None:
        _init_firebase()
    return _db


def verify_token(id_token: str) -> dict | None:
    """Verify a Firebase ID token and return the decoded claims."""
    try:
        _init_firebase()
        return auth.verify_id_token(id_token)
    except Exception:
        return None


# ── Email CRUD ────────────────────────────────────────────────────────────────

def save_email_result(uid: str, email_data: dict) -> str:
    """Save a classified email result to Firestore. Returns the document ID."""
    db = get_db()
    if db is None:
        return "demo-id"
    ref = db.collection("emails").document(uid).collection("items").document()
    ref.set(email_data)
    return ref.id


def get_email_history(uid: str, limit: int = 50) -> list[dict]:
    """Fetch recent classified emails for a user."""
    db = get_db()
    if db is None:
        return []
    docs = (
        db.collection("emails").document(uid).collection("items")
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_analytics(uid: str) -> dict:
    """Aggregate spam/threat statistics for a user."""
    db = get_db()
    if db is None:
        return {"total": 0, "spam": 0, "ham": 0, "high_risk": 0}
    docs = list(
        db.collection("emails").document(uid).collection("items")
        .stream()
    )
    total    = len(docs)
    spam     = sum(1 for d in docs if d.to_dict().get("label") == "spam")
    high_risk = sum(1 for d in docs if d.to_dict().get("threat_level") in ("high", "critical"))
    return {
        "total":    total,
        "spam":     spam,
        "ham":      total - spam,
        "high_risk": high_risk,
        "spam_rate": round((spam / total * 100), 1) if total else 0,
    }


# ── Gmail token storage ────────────────────────────────────────────────────────

def save_gmail_tokens(uid: str, tokens: dict) -> None:
    db = get_db()
    if db is None:
        return
    db.collection("users").document(uid).set(
        {"gmail_tokens": tokens, "gmail_connected": True}, merge=True
    )


def get_gmail_tokens(uid: str) -> dict | None:
    db = get_db()
    if db is None:
        return None
    doc = db.collection("users").document(uid).get()
    if doc.exists:
        return doc.to_dict().get("gmail_tokens")
    return None
