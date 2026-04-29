from django.urls import path
# path() maps a URL pattern to a view function

from . import views
# import all view functions from views.py in this same app

# all these URLs are prefixed with /api/ because of the include() in studentnest/urls.py
# so path('signup/') becomes /api/signup/ in the browser

urlpatterns = [
    # --- Authentication ---
    path('signup/', views.signup, name='signup'),
    # POST /api/signup/ — register a new student account

    path('login/', views.login, name='login'),
    # POST /api/login/ — log in with email and password, starts a session

    path('logout/', views.logout, name='logout'),
    # POST /api/logout/ — end the session

    path('check-session/', views.check_session, name='check_session'),
    # GET /api/check-session/ — frontend calls this on page load to check if user is still logged in

    path('online-users/', views.online_users, name='online_users'),
    # GET /api/online-users/ — returns list of students active in the last 5 minutes

    # --- Room Management ---
    path('rooms/', views.room_list_create, name='room_list_create'),
    # GET /api/rooms/ — list all rooms (with search/filter support)
    # POST /api/rooms/ — create a new room listing

    path('rooms/<int:room_id>/', views.room_detail, name='room_detail'),
    # GET /api/rooms/5/ — get details of room with id 5
    # PUT /api/rooms/5/ — update room 5 (owner only)
    # DELETE /api/rooms/5/ — delete room 5 (owner only)
    # <int:room_id> captures the number from the URL and passes it to the view

    path('my-rooms/', views.my_rooms, name='my_rooms'),
    # GET /api/my-rooms/ — returns only the rooms posted by the logged-in student

    # --- Messages ---
    path('messages/', views.get_messages, name='get_messages'),
    # GET /api/messages/ — get all messages received by the logged-in student

    path('messages/send/', views.send_message, name='send_message'),
    # POST /api/messages/send/ — send a message to a room owner

    path('messages/sent/', views.get_sent_messages, name='get_sent_messages'),
    # GET /api/messages/sent/ — get all messages sent by the logged-in student

    path('messages/<int:message_id>/read/', views.mark_message_read, name='mark_message_read'),
    # POST /api/messages/7/read/ — mark message 7 as read

    path('conversations/', views.get_conversations, name='get_conversations'),
    # GET /api/conversations/ — get a list of unique conversations (grouped by the other person)

    path('conversation/messages/', views.get_conversation_messages, name='get_conversation_messages'),
    # GET /api/conversation/messages/?other_id=3&room_id=5 — get all messages in a specific conversation

    # --- Favorites ---
    path('favorites/', views.get_favorites, name='get_favorites'),
    # GET /api/favorites/ — get all rooms the student has saved

    path('favorites/add/', views.add_favorite, name='add_favorite'),
    # POST /api/favorites/add/ — save a room to favorites

    path('favorites/<int:room_id>/remove/', views.remove_favorite, name='remove_favorite'),
    # DELETE /api/favorites/5/remove/ — unsave room 5

    path('favorites/<int:room_id>/check/', views.check_favorite, name='check_favorite'),
    # GET /api/favorites/5/check/ — check if room 5 is in the student's favorites

    # --- Reports ---
    path('reports/create/', views.create_report, name='create_report'),
    # POST /api/reports/create/ — submit a report about a listing

    path('reports/my/', views.get_my_reports, name='get_my_reports'),
    # GET /api/reports/my/ — get all reports submitted by the logged-in student

    # --- Password Reset ---
    path('password-reset/request/', views.request_password_reset, name='request_password_reset'),
    # POST /api/password-reset/request/ — send a reset email with a token link

    path('password-reset/confirm/', views.reset_password, name='reset_password'),
    # POST /api/password-reset/confirm/ — set a new password using the token
]
