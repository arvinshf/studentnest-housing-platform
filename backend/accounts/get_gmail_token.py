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

import sys
import urllib.parse
import webbrowser

import requests

REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'
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
    print('\nOpening Chrome for authorization...')
    print('After you click Allow, Google will show you an authorization code.')
    print('Copy that code and paste it back here.\n')
    import subprocess
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    try:
        subprocess.Popen([chrome_path, auth_url])
    except FileNotFoundError:
        print('Chrome not found, opening default browser instead')
        webbrowser.open(auth_url)

    auth_code = input('Paste the authorization code here: ').strip()

    if not auth_code:
        print('ERROR: No authorization code entered.')
        sys.exit(1)

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
