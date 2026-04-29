from django.shortcuts import render
# render() loads an HTML template from the templates/ folder and returns it as an HTTP response
# it also passes any context variables into the template (we do not use any here)

# each of these views simply serves a static HTML page
# the actual logic (API calls, form handling) is done by JavaScript in the browser
# these views just deliver the HTML shell to the browser


def index(request):
    """Landing page — the first page visitors see with the login form"""
    return render(request, 'index.html')
    # looks for backend/templates/index.html


def signup(request):
    """Registration page — new students create an account here"""
    return render(request, 'signup.html')


def home(request):
    """Main room listings page — shows all available rooms with filters"""
    return render(request, 'home.html')


def portal(request):
    """Student dashboard — messages, favorites, my listings, reports"""
    return render(request, 'portal.html')


def post_room(request):
    """Room posting form — landlord students fill this out to list a room"""
    return render(request, 'post-room.html')


def room_details(request):
    """Individual room page — shows full details, images, and contact form"""
    return render(request, 'room-details.html')


def reset_password(request):
    """Password reset page — student lands here after clicking the email link"""
    return render(request, 'reset-password.html')


def not_found(request):
    """Custom 404 error page"""
    return render(request, '404.html')
