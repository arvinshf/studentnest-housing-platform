from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('check-session/', views.check_session, name='check_session'),
    path('online-users/', views.online_users, name='online_users'),
    
    # Room Management
    path('rooms/', views.room_list_create, name='room_list_create'),
    path('rooms/<int:room_id>/', views.room_detail, name='room_detail'),
    path('my-rooms/', views.my_rooms, name='my_rooms'),
    
    # Messages
    path('messages/', views.get_messages, name='get_messages'),
    path('messages/send/', views.send_message, name='send_message'),
    path('messages/sent/', views.get_sent_messages, name='get_sent_messages'),
    path('messages/<int:message_id>/read/', views.mark_message_read, name='mark_message_read'),
    path('conversations/', views.get_conversations, name='get_conversations'),
    path('conversation/messages/', views.get_conversation_messages, name='get_conversation_messages'),
    
    # Favorites
    path('favorites/', views.get_favorites, name='get_favorites'),
    path('favorites/add/', views.add_favorite, name='add_favorite'),
    path('favorites/<int:room_id>/remove/', views.remove_favorite, name='remove_favorite'),
    path('favorites/<int:room_id>/check/', views.check_favorite, name='check_favorite'),
    
    # Reports
    path('reports/create/', views.create_report, name='create_report'),
    path('reports/my/', views.get_my_reports, name='get_my_reports'),
]
