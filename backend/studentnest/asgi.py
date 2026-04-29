"""
ASGI config for studentnest project.
ASGI is the async version of WSGI — used for real-time features like websockets.
Not actively used in this project, but Django generates it by default.
"""

import os
# os lets us set environment variables

from django.core.asgi import get_asgi_application
# creates the async application object — similar to WSGI but for async servers

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studentnest.settings')
# tells Django which settings file to load

application = get_asgi_application()
