"""
One-time script to get a Gmail API refresh token.


Steps before running:
  1. Go to https://console.cloud.google.com/
  2. Create a project (e.g. "StudentNest")
  3. Enable the Gmail API (APIs & Services > Library > search "Gmail API" > Enable)
  4. Go to APIs & Services > OAuth consent screen
     - Choose "External", click Create
     - App name: StudentNest, User support email: your email
     - Add scope: https://www.googleapis.com/auth/gmail.send
     - Add test user: support.studentnest@gmail.com
     - Save
  5. Go to APIs & Services > Credentials > Create Credentials > OAuth client ID
     - Application type: Desktop app
     - Name: StudentNest Local
     - Download or copy the Client ID and Client Secret

Usage:
  python get_gmail_token.py
"""

import sys
import urllib.parse
import webbrowser
import http.server
import threading
import subprocess

import requests

REDIRECT_URI = 'http://localhost:8765'
SCOPE = 'https://www.googleapis.com/auth/gmail.send'

_auth_code = None

class _Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global _auth_code
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        _auth_code = params.get('code', [None])[0]
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'<h2>Authorization received. You can close this tab.</h2>')

    def log_message(self, *args):
        pass  # silence server logs


def main():
    client_id = input('Paste your Client ID: ').strip()
    client_secret = input('Paste your Client Secret: ').strip()

    # start local server to capture the redirect
    server = http.server.HTTPServer(('localhost', 8765), _Handler)
    thread = threading.Thread(target=server.handle_request)
    thread.daemon = True
    thread.start()

    # open the Google consent screen in the browser
    auth_url = (
        'https://accounts.google.com/o/oauth2/v2/auth?'
        f'client_id={urllib.parse.quote(client_id)}&'
        f'redirect_uri={urllib.parse.quote(REDIRECT_URI)}&'
        'response_type=code&'
        f'scope={urllib.parse.quote(SCOPE)}&'
        'access_type=offline&'
        'prompt=consent'
    )
    print('\nOpening browser for authorization...')
    print('Sign in, click Allow, then come back here.\n')
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    try:
        subprocess.Popen([chrome_path, auth_url])
    except FileNotFoundError:
        webbrowser.open(auth_url)

    thread.join(timeout=120)
    auth_code = _auth_code

    if not auth_code:
        print('ERROR: No authorization code received.')
        sys.exit(1)

    print('Authorization code received!\n')

    # swap the auth code for tokens
    resp = requests.post('https://oauth2.googleapis.com/token', data={
        'code': auth_code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code',
    })

    if resp.status_code != 200:
        print(f'ERROR: {resp.json()}')
        sys.exit(1)

    tokens = resp.json()
    refresh_token = tokens.get('refresh_token')

    print('\n' + '=' * 50)
    print('YOUR REFRESH TOKEN:')
    print(refresh_token)
    print('=' * 50)
    print()
    print('Add these lines to your PythonAnywhere WSGI file:')
    print(f"os.environ['GMAIL_CLIENT_ID'] = '{client_id}'")
    print(f"os.environ['GMAIL_CLIENT_SECRET'] = '{client_secret}'")
    print(f"os.environ['GMAIL_REFRESH_TOKEN'] = '{refresh_token}'")
    print()


if __name__ == '__main__':
    main()
