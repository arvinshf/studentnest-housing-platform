"""
WSGI config for studentnest project.
WSGI stands for Web Server Gateway Interface — it's the standard way
Python web apps talk to production web servers like PythonAnywhere or Gunicorn.
"""

import os
# os lets us set environment variables

from django.core.wsgi import get_wsgi_application
# this function creates the WSGI application object that the server calls on every request

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studentnest.settings')
# tells Django which settings file to use when the app starts up

application = get_wsgi_application()
