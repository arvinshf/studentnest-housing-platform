from django.urls import path
# path() maps URL patterns to view functions

from . import views
# import all the view functions from this app's views.py

# these are the frontend page routes — they serve HTML templates (not JSON like the API)
# included in studentnest/urls.py with path('', include('frontend.urls'))
# so they have no prefix — the URL is exactly what is listed here

urlpatterns = [
    path('', views.index, name='index'),
    # the root URL (https://arwin001.pythonanywhere.com/) shows the landing page

    path('index.html', views.index, name='index_html'),
    # also serve index.html explicitly in case someone types it in the URL bar

    path('signup.html', views.signup, name='signup'),
    # the signup/registration page

    path('home.html', views.home, name='home'),
    # the main room listings page (after login)

    path('portal.html', views.portal, name='portal'),
    # the student dashboard/portal page

    path('post-room.html', views.post_room, name='post_room'),
    # the form page for posting a new room listing

    path('room-details.html', views.room_details, name='room_details'),
    # the individual room detail page

    path('reset-password.html', views.reset_password, name='reset_password'),
    # the page where students enter their new password after clicking the email link

    path('404.html', views.not_found, name='not_found'),
    # custom 404 error page
]
