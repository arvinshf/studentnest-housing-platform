# PythonAnywhere Deployment Guide

## Step 1: Create Account
1. Go to https://www.pythonanywhere.com/
2. Click "Start running Python online in less than a minute!"
3. Create a free Beginner account
4. Verify your email

## Step 2: Clone Your Repository
1. After login, click "Consoles" tab
2. Click "Bash" to open a new console
3. Run these commands:
```bash
git clone https://github.com/arvinshf/studentnest-housing-platform.git
cd studentnest-housing-platform/backend
```

## Step 3: Create Virtual Environment
```bash
mkvirtualenv --python=/usr/bin/python3.10 studentnest
pip install -r requirements.txt
```

## Step 4: Set Up Web App
1. Click "Web" tab at the top
2. Click "Add a new web app"
3. Click "Next" (accept domain: yourusername.pythonanywhere.com)
4. Select "Manual configuration"
5. Select "Python 3.10"
6. Click "Next"

## Step 5: Configure Web App
In the Web tab, scroll down and configure:

### A) Source code
- **Source code:** `/home/yourusername/studentnest-housing-platform/backend`
- **Working directory:** `/home/yourusername/studentnest-housing-platform/backend`

### B) Virtualenv
- **Virtualenv:** `/home/yourusername/.virtualenvs/studentnest`

### C) WSGI Configuration File
1. Click the link to edit WSGI file (e.g., `/var/www/yourusername_pythonanywhere_com_wsgi.py`)
2. **DELETE ALL CONTENTS** and replace with:

```python
import os
import sys

# Add your project directory to the sys.path
path = '/home/yourusername/studentnest-housing-platform/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Set environment variable for Django settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'studentnest.settings'

# Set environment variables (instead of .env file)
os.environ['SECRET_KEY'] = 'django-insecure-pythonanywhere-production-key-change-this'
os.environ['DEBUG'] = 'False'
os.environ['ALLOWED_HOSTS'] = 'yourusername.pythonanywhere.com'

# Load Django application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

**IMPORTANT:** Replace `yourusername` with your actual PythonAnywhere username in 3 places above!

3. Click "Save" button at the top

### D) Static Files
Scroll to "Static files" section and add:

| URL          | Directory                                                           |
|--------------|---------------------------------------------------------------------|
| /static/     | /home/yourusername/studentnest-housing-platform/backend/staticfiles |
| /media/      | /home/yourusername/studentnest-housing-platform/backend/media       |

**IMPORTANT:** Replace `yourusername` with your actual username!

## Step 6: Database Setup
Go back to Bash console:
```bash
cd ~/studentnest-housing-platform/backend
python manage.py migrate
python manage.py collectstatic --no-input
python manage.py createsuperuser
```

When prompted:
- Email: your email
- Name: your name
- Phone: your phone
- City: your city
- Password: create a strong password
- Confirm password

## Step 7: Launch Site
1. Go to "Web" tab
2. Click the big green "Reload" button
3. Click the link at the top: `yourusername.pythonanywhere.com`
4. Your site should be live!

## Step 8: Test Everything
1. Visit `https://yourusername.pythonanywhere.com`
2. Click "Get Started" or "Sign Up"
3. Create an account
4. Login
5. Navigate between pages - you should stay logged in!
6. Try posting a room

## To Update Your Site Later
1. Make changes locally and push to GitHub
2. Go to PythonAnywhere Bash console
3. Run:
```bash
cd ~/studentnest-housing-platform/backend
git pull
python manage.py migrate  # if you changed models
python manage.py collectstatic --no-input  # if you changed CSS/JS
```
4. Go to Web tab and click "Reload"

## Access Admin Panel
- Visit: `https://yourusername.pythonanywhere.com/admin/`
- Login with the superuser you created in Step 6

## Troubleshooting
- **500 Error:** Check error log in Web tab
- **Static files not loading:** Run collectstatic again
- **Database errors:** Run migrate again
- **Site not updating:** Click Reload button in Web tab

## Your URLs
- Website: `https://yourusername.pythonanywhere.com`
- Admin: `https://yourusername.pythonanywhere.com/admin/`
- API: `https://yourusername.pythonanywhere.com/api/`
