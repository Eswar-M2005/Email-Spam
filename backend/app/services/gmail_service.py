"""
Gmail API Service — OAuth flow and email fetching
"""

import os
import base64
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask import current_app

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def get_oauth_flow() -> Flow:
    client_config = {
        "web": {
            "client_id":     os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5001/api/gmail/callback")],
            "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
            "token_uri":     "https://oauth2.googleapis.com/token",
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5001/api/gmail/callback"),
    )
    return flow


def get_authorization_url() -> tuple[str, str]:
    """Generate the OAuth authorization URL and state token."""
    flow = get_oauth_flow()
    url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return url, state


def exchange_code_for_tokens(code: str) -> dict:
    """Exchange OAuth authorization code for access/refresh tokens."""
    flow = get_oauth_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    return {
        "token":         creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri":     creds.token_uri,
        "client_id":     creds.client_id,
        "client_secret": creds.client_secret,
        "scopes":        list(creds.scopes or SCOPES),
    }


def build_gmail_service(tokens: dict):
    """Build an authenticated Gmail API service from stored tokens."""
    creds = Credentials(
        token=tokens.get("token"),
        refresh_token=tokens.get("refresh_token"),
        token_uri=tokens.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=tokens.get("client_id", os.getenv("GOOGLE_CLIENT_ID")),
        client_secret=tokens.get("client_secret", os.getenv("GOOGLE_CLIENT_SECRET")),
        scopes=tokens.get("scopes", SCOPES),
    )
    return build("gmail", "v1", credentials=creds)


def fetch_recent_emails(tokens: dict, max_results: int = 20) -> list[dict]:
    """Fetch and parse the most recent emails from the user's inbox."""
    try:
        service = build_gmail_service(tokens)
        result  = service.users().messages().list(
            userId="me", maxResults=max_results, labelIds=["INBOX"]
        ).execute()

        messages = result.get("messages", [])
        emails   = []

        for msg_ref in messages:
            msg = service.users().messages().get(
                userId="me", id=msg_ref["id"], format="full"
            ).execute()
            parsed = _parse_message(msg)
            emails.append(parsed)

        return emails
    except Exception as e:
        return []


def _parse_message(msg: dict) -> dict:
    """Parse a raw Gmail message into a clean dict."""
    headers   = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
    subject   = headers.get("Subject", "(no subject)")
    sender    = headers.get("From", "unknown")
    date      = headers.get("Date", "")
    body      = _extract_body(msg.get("payload", {}))

    return {
        "id":              msg.get("id"),
        "thread_id":       msg.get("threadId"),
        "subject":         subject,
        "sender":          sender,
        "date":            date,
        "body":            body[:3000],          # Truncate for ML
        "snippet":         msg.get("snippet", ""),
        "has_attachments": _has_attachments(msg.get("payload", {})),
        "label_ids":       msg.get("labelIds", []),
    }


def _extract_body(payload: dict) -> str:
    """Recursively extract plain text body from MIME parts."""
    mime_type = payload.get("mimeType", "")

    if mime_type == "text/plain":
        data = payload.get("body", {}).get("data", "")
        if data:
            return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")

    parts = payload.get("parts", [])
    for part in parts:
        result = _extract_body(part)
        if result:
            return result
    return ""


def _has_attachments(payload: dict) -> bool:
    """Check if any MIME part is a file attachment."""
    for part in payload.get("parts", []):
        if part.get("filename"):
            return True
        if _has_attachments(part):
            return True
    return False
