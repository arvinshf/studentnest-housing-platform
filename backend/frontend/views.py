from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def signup(request):
    return render(request, 'signup.html')

def home(request):
    return render(request, 'home.html')

def portal(request):
    return render(request, 'portal.html')

def post_room(request):
    return render(request, 'post-room.html')

def room_details(request):
    return render(request, 'room-details.html')

def not_found(request):
    return render(request, '404.html')
