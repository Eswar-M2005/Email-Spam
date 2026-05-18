"""
WSGI entry point — for Gunicorn / Render deployment
"""

from app import create_app, socketio

app = socketio.middleware(create_app())

if __name__ == "__main__":
    import os
    flask_app = create_app()
    port = int(os.environ.get("PORT", 5001))
    socketio.run(flask_app, host="0.0.0.0", port=port, debug=False)
