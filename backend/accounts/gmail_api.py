"""
Send emails through Gmail's REST API instead of SMTP.
PythonAnywhere free tier blocks outbound SMTP (port 587/465),
but it allows HTTPS requests to googleapis.com — so we use Gmail's API instead.
"""

import base64
# base64 encoding is required by the Gmail API — the email must be sent as a base64 string

import logging
from email.mime.text import MIMEText
# MIMEText builds a properly formatted email object (with headers like To, From, Subject)

import requests
# requests is an HTTP library — we use it to call the Gmail API over HTTPS

from django.conf import settings as django_settings
# access our Gmail credentials stored in settings.py

logger = logging.getLogger(__name__)
# logger for this file — writes to the Django log

TOKEN_URL = 'https://oauth2.googleapis.com/token'
# Google's OAuth2 endpoint — we send our refresh token here to get a fresh access token

SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
# Gmail API endpoint that actually sends the email


def _get_access_token():
    """Swap our stored refresh token for a short-lived access token.
    Refresh tokens last forever (unless revoked), but access tokens expire after ~1 hour.
    So every time we want to send an email, we get a fresh access token first."""

    resp = requests.post(TOKEN_URL, data={
        'client_id': django_settings.GMAIL_CLIENT_ID,
        # our Google Cloud OAuth client ID

        'client_secret': django_settings.GMAIL_CLIENT_SECRET,
        # the secret paired with the client ID

        'refresh_token': django_settings.GMAIL_REFRESH_TOKEN,
        # the long-lived token we obtained during the one-time setup

        'grant_type': 'refresh_token',
        # tells Google we are exchanging a refresh token for an access token
    }, timeout=15)
    # timeout=15 means give up if Google does not respond within 15 seconds

    resp.raise_for_status()
    # raises an exception if Google returned an error (like 401 Unauthorized)

    return resp.json()['access_token']
    # the response JSON contains {"access_token": "ya29.a0AfH6SM...", "expires_in": 3599, ...}


def send_email(to, subject, body):
    """Send a plain-text email via the Gmail REST API.
    Called from the password reset view to send the reset link."""

    access_token = _get_access_token()
    # get a fresh access token (valid for ~1 hour)

    # build the email using Python's built-in email library
    msg = MIMEText(body)
    # creates a MIME message with the body as plain text

    msg['to'] = to
    # the recipient's email address

    msg['from'] = django_settings.DEFAULT_FROM_EMAIL
    # the sender — set in settings.py as "support.studentnest@gmail.com"

    msg['subject'] = subject
    # the email subject line

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    # Gmail API requires the entire email to be base64url-encoded
    # .as_bytes() converts the MIME message to raw bytes
    # base64.urlsafe_b64encode encodes it (uses - and _ instead of + and /)
    # .decode() converts bytes back to a string for JSON serialization

    resp = requests.post(
        SEND_URL,
        headers={
            'Authorization': f'Bearer {access_token}',
            # Bearer token authentication — proves we are authorized to send as this Gmail account

            'Content-Type': 'application/json',
        },
        json={'raw': raw},
        # the API expects {"raw": "<base64-encoded-email>"}

        timeout=15,
    )
    resp.raise_for_status()
    # raises an exception if Gmail rejected the email

    logger.info(f"[Gmail API] Email sent to {to} — message id: {resp.json().get('id')}")
    # log the success with the Gmail message ID for debugging

    return resp.json()
