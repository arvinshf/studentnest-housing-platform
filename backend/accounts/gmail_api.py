"""
Send emails through Gmail's REST API instead of SMTP.
PythonAnywhere free tier blocks SMTP but allows HTTPS to googleapis.com.
"""

import base64
import logging
from email.mime.text import MIMEText

import requests
from django.conf import settings as django_settings

logger = logging.getLogger(__name__)

TOKEN_URL = 'https://oauth2.googleapis.com/token'
SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'


def _get_access_token():
    """Swap the stored refresh token for a short-lived access token."""
    resp = requests.post(TOKEN_URL, data={
        'client_id': django_settings.GMAIL_CLIENT_ID,
        'client_secret': django_settings.GMAIL_CLIENT_SECRET,
        'refresh_token': django_settings.GMAIL_REFRESH_TOKEN,
        'grant_type': 'refresh_token',
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()['access_token']


def send_email(to, subject, body):
    """Send a plain-text email via the Gmail REST API."""
    access_token = _get_access_token()

    msg = MIMEText(body)
    msg['to'] = to
    msg['from'] = django_settings.DEFAULT_FROM_EMAIL
    msg['subject'] = subject

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    resp = requests.post(
        SEND_URL,
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        },
        json={'raw': raw},
        timeout=15,
    )
    resp.raise_for_status()
    logger.info(f"[Gmail API] Email sent to {to} — message id: {resp.json().get('id')}")
    return resp.json()
