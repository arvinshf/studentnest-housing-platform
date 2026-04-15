"""
URL configuration for studentnest project.
This is the main URL router — every incoming request hits this file first,
and gets forwarded to the right app based on the URL pattern.
"""

from django.contrib import admin
# gives us access to the built-in admin panel

from django.urls import path, include
# path defines a URL pattern, include delegates to another app's urls.py

from django.conf import settings
# lets us read settings like DEBUG and MEDIA_ROOT

from django.conf.urls.static import static
# helper function to serve media files during development

urlpatterns = [
    path('admin/', admin.site.urls),
    # any URL starting with /admin/ goes to Django's admin panel

    path('api/', include('accounts.urls')),
    # any URL starting with /api/ gets forwarded to accounts/urls.py
    # for example /api/login/ becomes login/ inside accounts/urls.py

    path('', include('frontend.urls')),
    # everything else (/, /home.html, /signup.html, etc.) goes to frontend/urls.py
    # this serves the HTML pages
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # in development mode, Django serves uploaded images from the /media/ URL
    # in production, PythonAnywhere handles this through its static files configuration
