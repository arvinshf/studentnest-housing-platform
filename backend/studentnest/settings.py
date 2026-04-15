"""
Django settings for studentnest project.
This file controls the entire behaviour of the application — database, security,
installed apps, middleware, email, static files, and more.
"""

from pathlib import Path
# Path gives us a clean way to work with file system paths

import os
# os lets us read environment variables and build file paths

import dj_database_url
# third-party library that parses a DATABASE_URL string into Django's database config format
# this lets us switch between SQLite (local) and PostgreSQL (production) with one env var

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
# __file__ is this settings.py file
# .resolve() gets the absolute path
# .parent goes up one folder (from studentnest/ to backend/)
# .parent.parent goes up again — so BASE_DIR = the backend/ folder

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-change-this-in-production-@#$%^&*()'
# Django uses this key to sign cookies, sessions, and tokens
# in production, this should be a random string stored in an env var

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
# when True, Django shows detailed error pages with stack traces
# the WSGI file on PythonAnywhere overrides this to False

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'arwin001.pythonanywhere.com']
# only requests coming to these hostnames are accepted
# anything else gets a 400 Bad Request — prevents host header attacks

# Application definition
# every feature in Django is an "app" — these are all the apps loaded when the server starts
INSTALLED_APPS = [
    'django.contrib.admin',          # the /admin/ panel for managing data
    'django.contrib.auth',           # Django's built-in user/auth system (used for superuser login)
    'django.contrib.contenttypes',   # tracks which models exist in which apps
    'django.contrib.sessions',       # server-side session storage (keeps users logged in)
    'django.contrib.messages',       # flash messages shown in the admin panel
    'django.contrib.staticfiles',    # finds and serves CSS, JS, and image files
    'rest_framework',                # Django REST Framework — makes building JSON APIs easy
    'corsheaders',                   # handles Cross-Origin Resource Sharing headers
    'accounts',                      # our main app — students, rooms, messages, favourites, reports
    'frontend',                      # serves the HTML template pages to the browser
]

MIDDLEWARE = [
    # middleware runs on every single request and response, in this order
    'django.middleware.security.SecurityMiddleware',        # enforces HTTPS, sets security headers
    'whitenoise.middleware.WhiteNoiseMiddleware',           # serves static files efficiently in production
    'django.contrib.sessions.middleware.SessionMiddleware', # loads the session from the cookie on each request
    'corsheaders.middleware.CorsMiddleware',                # adds CORS headers so the frontend can talk to the API
    'django.middleware.common.CommonMiddleware',            # handles URL normalisation like trailing slashes
    # 'django.middleware.csrf.CsrfViewMiddleware',         # CSRF protection — disabled because our API uses @csrf_exempt
    'django.contrib.auth.middleware.AuthenticationMiddleware', # attaches the logged-in user to each request
    'django.contrib.messages.middleware.MessageMiddleware',    # makes flash messages available
    'django.middleware.clickjacking.XFrameOptionsMiddleware', # prevents the site from being embedded in an iframe
]

ROOT_URLCONF = 'studentnest.urls'
# tells Django which file contains the main URL routing — studentnest/urls.py

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # use Django's own template engine to render HTML files

        'DIRS': [BASE_DIR / 'templates'],
        # look for HTML templates in the backend/templates/ folder

        'APP_DIRS': True,
        # also check each app's own templates/ folder

        'OPTIONS': {
            'context_processors': [
                # context processors inject variables into every template automatically
                'django.template.context_processors.debug',    # adds debug flag
                'django.template.context_processors.request',  # adds the request object
                'django.contrib.auth.context_processors.auth',     # adds user info
                'django.contrib.messages.context_processors.messages', # adds flash messages
            ],
        },
    },
]

WSGI_APPLICATION = 'studentnest.wsgi.application'
# points to the WSGI application object that production servers use to run the app

# Database
# dj_database_url parses a URL string into the format Django expects
# locally it falls back to SQLite, on PythonAnywhere it reads DATABASE_URL which points to PostgreSQL
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        # if no DATABASE_URL env var is set, use a local SQLite file called db.sqlite3

        conn_max_age=600,
        # keep database connections open for 10 minutes instead of opening a new one every request

        conn_health_checks=True,
        # check that a reused connection is still alive before using it
    )
}

# Password validation
# these validators run when Django's built-in auth system checks passwords (e.g. createsuperuser)
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        # rejects passwords that are too similar to the username or email
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
            # password must be at least 12 characters long
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        # rejects commonly used passwords like "password123" or "qwerty"
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        # rejects passwords that are entirely numeric like "123456789012"
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
# the default language for the application

TIME_ZONE = 'UTC'
# all timestamps are stored in UTC — avoids timezone confusion

USE_I18N = True
# enables Django's translation framework (internationalisation)

USE_TZ = True
# stores datetimes as timezone-aware in the database

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
# the URL prefix for serving static files — e.g. /static/style.css

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# where collectstatic copies all static files to — this is what the production server serves

STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
# where Django looks for the original static files during development

# Use CompressedStaticFilesStorage only if not in DEBUG mode
if DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
    # WhiteNoise compresses and caches static files for faster delivery
else:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
    # same in production — WhiteNoise handles compression and cache headers

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# all models will use auto-incrementing 64-bit integer IDs by default

# CORS settings — Controls which frontend origins can make requests to our API
# without CORS, browsers would block JavaScript from calling our API from a different origin
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5500",         # VS Code Live Server
    "http://127.0.0.1:5500",        # VS Code Live Server (alternative)
    "http://localhost:8000",         # Django development server
    "http://127.0.0.1:8000",        # Django development server (alternative)
    "http://localhost:3000",         # Python HTTP server for frontend
    "http://127.0.0.1:3000",        # Python HTTP server (alternative)
    "http://localhost:8080",         # alternative dev server port
    "http://127.0.0.1:8080",        # alternative dev server port
    "https://studentnest-housing.netlify.app",  # old Netlify deployment
]

# Allow requests from file:// for development (when opening HTML directly)
CORS_ALLOW_ALL_ORIGINS = False  # keep this False in production for security

CORS_ALLOW_CREDENTIALS = True
# allows cookies (including session cookies) to be sent with cross-origin requests
# without this, login sessions would not persist across origins

# CSRF settings — Cross-Site Request Forgery protection
# these origins are trusted for form submissions
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://studentnest-housing.netlify.app",
]

# Email settings — Gmail REST API (works on PythonAnywhere free tier)
# PythonAnywhere free accounts block outgoing SMTP connections,
# so we send emails through the Gmail API over HTTPS instead
GMAIL_CLIENT_ID = os.environ.get('GMAIL_CLIENT_ID', '')
# OAuth2 client ID from Google Cloud Console — identifies our app to Google

GMAIL_CLIENT_SECRET = os.environ.get('GMAIL_CLIENT_SECRET', '')
# OAuth2 client secret — proves our app is authorised

GMAIL_REFRESH_TOKEN = os.environ.get('GMAIL_REFRESH_TOKEN', '')
# long-lived token that lets us get fresh access tokens without re-authenticating

DEFAULT_FROM_EMAIL = 'StudentNest <support.studentnest@gmail.com>'
# the "From" address shown in password reset emails

# Domain for password reset links
SITE_DOMAIN = os.environ.get('SITE_DOMAIN', 'arwin001.pythonanywhere.com')
# used to build the full URL in reset emails, e.g. https://arwin001.pythonanywhere.com/reset-password.html

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    # we do not use DRF's built-in token or JWT auth
    # instead we handle authentication manually using Django sessions

    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
        # all API endpoints are publicly accessible by default
        # individual views check session login status themselves
    ],
}

# Session settings — how login cookies behave
SESSION_COOKIE_SAMESITE = 'Lax'
# Lax means the cookie is sent on same-site requests and top-level navigations
# this is safe because our frontend and API are on the same domain

SESSION_COOKIE_SECURE = True
# cookie is only sent over HTTPS — prevents interception on insecure connections

SESSION_COOKIE_HTTPONLY = True
# JavaScript cannot read this cookie — protects against XSS attacks

SESSION_COOKIE_AGE = 86400
# session lasts 24 hours (86400 seconds) before the user needs to log in again

SESSION_SAVE_EVERY_REQUEST = True
# refresh the session expiry on every request so active users stay logged in

SESSION_COOKIE_NAME = 'studentnest_sessionid'
# custom cookie name instead of the default "sessionid" — avoids conflicts

SESSION_COOKIE_PATH = '/'
# cookie is available on all URL paths

# Media files (user uploads like room images)
MEDIA_URL = '/media/'
# URL prefix for uploaded files — e.g. /media/room_images/photo.jpg

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# the folder on disk where uploaded files are stored — backend/media/

# Production security settings — only active when DEBUG is False
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    # redirect all HTTP requests to HTTPS

    SESSION_COOKIE_SECURE = True
    # ensure session cookie only sent over HTTPS

    CSRF_COOKIE_SECURE = True
    # ensure CSRF cookie only sent over HTTPS

    SECURE_BROWSER_XSS_FILTER = True
    # tells the browser to enable its built-in XSS protection

    SECURE_CONTENT_TYPE_NOSNIFF = True
    # prevents browsers from guessing the content type of a response

    X_FRAME_OPTIONS = 'DENY'
    # blocks the site from being loaded inside an iframe — prevents clickjacking
