"""
One-time script to get a Gmail API refresh token.
Run this on your LOCAL machine (not on PythonAnywhere).

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

import http.server
import sys
import urllib.parse
import webbrowser

import requests

REDIRECT_URI = 'http://localhost:8090'
SCOPE = 'https://www.googleapis.com/auth/gmail.send'


def main():
    client_id = input('Paste your Client ID: ').strip()
    client_secret = input('Paste your Client Secret: ').strip()

    # open the Google consent screen in the browser
    auth_url = (
        'https://accounts.google.com/o/oauth2/v2/auth?'
        f'client_id={client_id}&'
        f'redirect_uri={REDIRECT_URI}&'
        'response_type=code&'
        f'scope={SCOPE}&'
        'access_type=offline&'
        'prompt=consent'
    )
    print('\nOpening your browser to authorize Gmail access...')
    webbrowser.open(auth_url)

    # tiny local server to catch the redirect with the auth code
    class Handler(http.server.BaseHTTPRequestHandler):
        code = None

        def do_GET(self):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            Handler.code = params.get('code', [None])[0]
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'Done! You can close this tab.')

        def log_message(self, *args):
            pass  # silence logs

    server = http.server.HTTPServer(('localhost', 8090), Handler)
    print('Waiting for authorization...')
    server.handle_request()

    if not Handler.code:
        print('ERROR: No authorization code received.')
        sys.exit(1)

    # swap the auth code for tokens
    resp = requests.post('https://oauth2.googleapis.com/token', data={
        'code': Handler.code,
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
