"""
Configuration — reads from environment variables / .env file
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY   = os.getenv("FLASK_SECRET_KEY", "change-me-in-production")
    DEBUG        = os.getenv("FLASK_ENV", "production") == "development"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

    # Firebase
    FIREBASE_PROJECT_ID    = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_PRIVATE_KEY   = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
    FIREBASE_CLIENT_EMAIL  = os.getenv("FIREBASE_CLIENT_EMAIL", "")

    # Gmail OAuth
    GOOGLE_CLIENT_ID      = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET  = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI   = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5001/api/gmail/callback")

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    # Redis / Celery
    REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    # ML Model
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "spam_classifier.pkl")
