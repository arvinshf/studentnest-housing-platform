from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('index.html', views.index, name='index_html'),
    path('signup.html', views.signup, name='signup'),
    path('home.html', views.home, name='home'),
    path('portal.html', views.portal, name='portal'),
    path('post-room.html', views.post_room, name='post_room'),
    path('room-details.html', views.room_details, name='room_details'),
    path('reset-password.html', views.reset_password, name='reset_password'),
    path('404.html', views.not_found, name='not_found'),
]
