"""
/api/analytics — Dashboard statistics
"""

from flask import Blueprint, jsonify, g
from app.routes.auth import require_auth
from app.services.firebase_service import get_analytics, get_email_history

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/summary")
@require_auth
def summary():
    """Return aggregate spam/threat statistics."""
    stats = get_analytics(g.uid)
    return jsonify(stats)


@analytics_bp.route("/recent")
@require_auth
def recent():
    """Return the last 50 classified emails for chart rendering."""
    emails = get_email_history(g.uid, limit=50)
    return jsonify({"emails": emails})


@analytics_bp.route("/demo")
def demo():
    """Public demo stats endpoint — no auth required."""
    return jsonify({
        "total":     1247,
        "spam":      312,
        "ham":       935,
        "high_risk": 89,
        "spam_rate": 25.0,
        "trend": [
            {"date": "Mon", "spam": 45, "ham": 132},
            {"date": "Tue", "spam": 52, "ham": 118},
            {"date": "Wed", "spam": 38, "ham": 141},
            {"date": "Thu", "spam": 67, "ham": 103},
            {"date": "Fri", "spam": 49, "ham": 127},
            {"date": "Sat", "spam": 31, "ham": 152},
            {"date": "Sun", "spam": 30, "ham": 162},
        ],
        "threat_levels": {
            "critical": 12,
            "high":     77,
            "medium":   143,
            "low":      80,
            "safe":     935,
        },
    })
