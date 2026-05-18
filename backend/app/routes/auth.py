"""
/api/auth — Firebase JWT verification middleware
"""

from functools import wraps
from flask import Blueprint, request, jsonify, g
from app.services.firebase_service import verify_token

auth_bp = Blueprint("auth", __name__)


def require_auth(f):
    """Decorator: validates Firebase ID token from Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        id_token = auth_header.split("Bearer ")[1]
        claims   = verify_token(id_token)

        if claims is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        g.uid   = claims.get("uid")
        g.email = claims.get("email")
        return f(*args, **kwargs)
    return decorated


@auth_bp.route("/verify", methods=["POST"])
def verify():
    """Verify a Firebase ID token and return user info."""
    data     = request.get_json(silent=True) or {}
    id_token = data.get("token", "")
    if not id_token:
        return jsonify({"error": "No token provided"}), 400

    claims = verify_token(id_token)
    if claims is None:
        return jsonify({"valid": False}), 401

    return jsonify({
        "valid": True,
        "uid":   claims.get("uid"),
        "email": claims.get("email"),
    })
