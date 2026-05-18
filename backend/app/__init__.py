"""
AI Email Security Platform — Flask Application Factory
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    CORS(app, origins=app.config["CORS_ORIGINS"])
    socketio.init_app(app)

    # ── Register blueprints ────────────────────────────────────────────────────
    from app.routes.predict import predict_bp
    from app.routes.auth import auth_bp
    from app.routes.gmail import gmail_bp
    from app.routes.analytics import analytics_bp
    from app.routes.ai import ai_bp

    app.register_blueprint(predict_bp, url_prefix="/api/predict")
    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(gmail_bp,   url_prefix="/api/gmail")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(ai_bp,      url_prefix="/api/ai")

    # ── Health check ───────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        from flask import jsonify
        return jsonify({"status": "ok", "version": "2.0.0"})

    return app
