from rest_framework import status
# status provides named HTTP status codes like HTTP_200_OK, HTTP_404_NOT_FOUND, etc.
# much more readable than using raw numbers like 200, 404

from rest_framework.decorators import api_view
# @api_view(['GET', 'POST']) tells DRF which HTTP methods a view function accepts
# also gives us request.data (parsed JSON body) and lets us return Response objects

from rest_framework.response import Response
# Response is DRF's version of HttpResponse — automatically converts dicts to JSON

from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
# @csrf_exempt disables CSRF protection on a view
# we use this because our API uses session auth from a separate frontend (not Django templates)

from django.utils.decorators import method_decorator
# used to apply decorators to class-based views (not actually used here but imported)

from django.utils import timezone
# timezone.now() returns the current UTC time

from django.conf import settings as django_settings
# gives access to everything in settings.py — aliased to avoid name clash with local variables

from .models import Student, Room, Message, Favorite, Report, PasswordResetToken
# import all our database models

from .gmail_api import send_email as gmail_send
# our custom Gmail REST API email sender — aliased as gmail_send for clarity

from .serializers import StudentSignupSerializer, StudentLoginSerializer, StudentSerializer, RoomSerializer, RoomCreateSerializer, MessageSerializer, MessageCreateSerializer
# serializers validate incoming data and convert model instances to JSON

import logging
logger = logging.getLogger(__name__)
# creates a logger named after this file ('accounts.views')
# logger.error() writes to Django's error log — useful for debugging on PythonAnywhere


# ============================================================
# AUTHENTICATION VIEWS
# ============================================================

@api_view(['POST'])
# this view only accepts POST requests — GET will return 405 Method Not Allowed
@csrf_exempt
def signup(request):
    """Handle student signup — creates a new account and logs them in"""
    serializer = StudentSignupSerializer(data=request.data)
    # request.data contains the JSON body sent by the frontend
    # the serializer validates every field (name length, email uniqueness, password match, etc.)

    if serializer.is_valid():
        student = serializer.save()
        # calls StudentSignupSerializer.create() which hashes the password and saves to DB

        # Set session — this is how we track who is logged in
        request.session['student_id'] = student.id
        request.session['student_email'] = student.email
        # Django stores this in the database (django_session table) and sends a session cookie to the browser

        student.is_online = True
        student.last_login = timezone.now()
        student.last_activity = timezone.now()
        student.save(update_fields=['is_online', 'last_login', 'last_activity'])
        # mark this student as online immediately after signup

        return Response({
            'message': 'Account created successfully!',
            'student': StudentSerializer(student).data
            # .data converts the Student instance to a dict like {id: 1, name: "...", email: "..."}
        }, status=status.HTTP_201_CREATED)
        # 201 means "Created" — the standard response when a new resource is made

    return Response({
        'message': 'Validation failed',
        'errors': serializer.errors
        # errors looks like {"email": ["An account with this email already exists."]}
    }, status=status.HTTP_400_BAD_REQUEST)
    # 400 means the client sent bad data


@api_view(['POST'])
@csrf_exempt
def login(request):
    """Handle student login — validates credentials and starts a session"""
    serializer = StudentLoginSerializer(data=request.data)
    # just checks that email and password are present and in the right format

    if not serializer.is_valid():
        return Response({
            'message': 'Invalid input',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email'].lower()
    password = serializer.validated_data['password']

    try:
        student = Student.objects.get(email=email)
        # look up the student by email — raises DoesNotExist if no match
    except Student.DoesNotExist:
        return Response({
            'message': 'No account found with this email.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not student.check_password(password):
        # hash the submitted password and compare it to the stored hash
        return Response({
            'message': 'Incorrect password.'
        }, status=status.HTTP_401_UNAUTHORIZED)
        # 401 means "Unauthorized" — wrong credentials

    # credentials are correct — set session and mark online
    request.session['student_id'] = student.id
    request.session['student_email'] = student.email

    student.is_online = True
    student.last_login = timezone.now()
    student.last_activity = timezone.now()
    student.save(update_fields=['is_online', 'last_login', 'last_activity'])

    return Response({
        'message': 'Login successful!',
        'student': StudentSerializer(student).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@csrf_exempt
def logout(request):
    """Handle student logout — marks them offline and destroys the session"""
    student_id = request.session.get('student_id')
    # get the student ID from the session — returns None if not logged in

    # Mark user as offline
    if student_id:
        try:
            student = Student.objects.get(id=student_id)
            student.is_online = False
            student.save(update_fields=['is_online'])
        except Student.DoesNotExist:
            pass
            # if the student was deleted, just ignore it
    
    request.session.flush()
    # flush() deletes the session from the database and clears the cookie
    # the browser will no longer be recognized as logged in

    return Response({
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def check_session(request):
    """Check if the user is still logged in — called by the frontend on every page load"""
    student_id = request.session.get('student_id')
    # try to get the student ID from the session cookie

    if not student_id:
        # no session = not logged in
        return Response({
            'authenticated': False
        }, status=status.HTTP_200_OK)

    try:
        student = Student.objects.get(id=student_id)

        # Update their activity timestamp — so the "online users" feature stays accurate
        student.last_activity = timezone.now()
        if not student.is_online:
            student.is_online = True
        student.save(update_fields=['last_activity', 'is_online'])

        return Response({
            'authenticated': True,
            'student': StudentSerializer(student).data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        # the student was deleted from the database but the session still exists
        request.session.flush()
        return Response({
            'authenticated': False
        }, status=status.HTTP_200_OK)


# ============================================================
# ROOM MANAGEMENT VIEWS
# ============================================================

@api_view(['GET', 'POST'])
@csrf_exempt
def room_list_create(request):
    """GET: list all active rooms | POST: create a new room listing"""

    if request.method == 'GET':
        # return all active room listings
        rooms = Room.objects.filter(is_active=True)
        # filter(is_active=True) excludes rooms that were "deleted" (soft delete)

        serializer = RoomSerializer(rooms, many=True, context={'request': request})
        # many=True tells DRF to serialize a queryset (list) instead of a single object
        # context={'request': request} is needed so the serializer can build absolute image URLs

        return Response({
            'rooms': serializer.data,
            'count': rooms.count()
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # create a new room listing — requires login
        student_id = request.session.get('student_id')
        if not student_id:
            return Response({
                'message': 'You must be logged in to post a room.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({
                'message': 'Invalid session. Please log in again.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # validate the room data
        serializer = RoomCreateSerializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save(owner=student)
            # save(owner=student) manually sets the owner field since it is not in the request body
            return Response({
                'message': 'Room posted successfully!',
                'room': RoomSerializer(room, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@csrf_exempt
def room_detail(request, room_id):
    """GET: view a room | PUT: update it (owner only) | DELETE: soft-delete it (owner only)"""

    try:
        room = Room.objects.get(id=room_id)
        # look up the room by its primary key
    except Room.DoesNotExist:
        return Response({
            'message': 'Room not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # anyone can view a room
        serializer = RoomSerializer(room, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'DELETE']:
        # only the owner can update or delete their room
        student_id = request.session.get('student_id')
        if not student_id or room.owner.id != student_id:
            return Response({
                'message': 'You do not have permission to modify this room.'
            }, status=status.HTTP_403_FORBIDDEN)
            # 403 means "Forbidden" — you are logged in but do not have access

        if request.method == 'PUT':
            serializer = RoomCreateSerializer(room, data=request.data, partial=True)
            # partial=True allows updating only some fields (PATCH-like behavior)
            if serializer.is_valid():
                room = serializer.save()
                return Response({
                    'message': 'Room updated successfully!',
                    'room': RoomSerializer(room, context={'request': request}).data
                }, status=status.HTTP_200_OK)
            return Response({
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            room.is_active = False
            room.save()
            # soft delete — the room is not actually removed from the database
            # it just becomes invisible because all queries filter by is_active=True
            return Response({
                'message': 'Room deleted successfully!'
            }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def my_rooms(request):
    """Get all rooms posted by the currently logged-in student"""
    student_id = request.session.get('student_id')

    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    rooms = Room.objects.filter(owner_id=student_id, is_active=True)
    # filter by both owner and active status
    serializer = RoomSerializer(rooms, many=True, context={'request': request})

    return Response({
        'rooms': serializer.data,
        'count': rooms.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def online_users(request):
    """Get all students who have been active in the last 10 minutes"""
    from datetime import timedelta
    # timedelta lets us do time math — "10 minutes ago"

    cutoff_time = timezone.now() - timedelta(minutes=10)
    # any activity before this time means the student is considered offline

    online_students = Student.objects.filter(
        is_online=True,
        last_activity__gte=cutoff_time
        # __gte means "greater than or equal" — only students active since the cutoff
    ).values('id', 'name', 'email', 'last_activity', 'last_login')
    # .values() returns dicts instead of model instances — lighter and faster

    return Response({
        'online_users': list(online_students),
        # list() converts the QuerySet to a plain list for JSON serialization
        'count': online_students.count()
    }, status=status.HTTP_200_OK)


# ============================================================
# MESSAGING VIEWS
# ============================================================

@api_view(['POST'])
@csrf_exempt
def send_message(request):
    """Send a message — either to a room owner (new inquiry) or as a reply to an existing conversation"""
    # check login
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in to send a message.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        sender = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session. Please log in again.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    serializer = MessageCreateSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    # check if this is a reply (recipient_id provided) or a new inquiry (just room_id)
    recipient_id = request.data.get('recipient_id')

    if recipient_id:
        # this is a reply — send directly to a specific student
        try:
            recipient = Student.objects.get(id=recipient_id)
        except Student.DoesNotExist:
            return Response({
                'message': 'Recipient not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        # optionally link the message to a room
        room_id = serializer.validated_data.get('room_id')
        room = None
        if room_id:
            try:
                room = Room.objects.get(id=room_id)
            except Room.DoesNotExist:
                pass
                # if the room was deleted, just send without linking
    else:
        # this is a new inquiry — look up the room owner
        room_id = serializer.validated_data['room_id']
        try:
            room = Room.objects.get(id=room_id, is_active=True)
            recipient = room.owner
            # the recipient is the person who posted the room
        except Room.DoesNotExist:
            return Response({
                'message': 'Room not found.'
            }, status=status.HTTP_404_NOT_FOUND)

    # prevent sending a message to yourself
    if sender.id == recipient.id:
        return Response({
            'message': 'You cannot send a message to yourself.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # create the message in the database
    message = Message.objects.create(
        sender=sender,
        recipient=recipient,
        room=room,
        subject=serializer.validated_data['subject'],
        content=serializer.validated_data['content']
    )

    return Response({
        'message': 'Message sent successfully!',
        'data': MessageSerializer(message).data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@csrf_exempt
def get_messages(request):
    """Get all messages received by the logged-in student (inbox)"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # get all messages where this student is the recipient
    messages = Message.objects.filter(recipient=student).select_related('sender', 'room')
    # select_related does a SQL JOIN — fetches sender and room data in the same query
    # without it, each message would cause a separate query to get sender.name etc.

    return Response({
        'messages': MessageSerializer(messages, many=True).data,
        'count': messages.count(),
        'unread_count': messages.filter(is_read=False).count()
        # count how many are still unread — used for notification badges
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def get_sent_messages(request):
    """Get all messages sent by the logged-in student (outbox)"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # get all messages where this student is the sender
    messages = Message.objects.filter(sender=student).select_related('recipient', 'room')

    return Response({
        'messages': MessageSerializer(messages, many=True).data,
        'count': messages.count()
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@csrf_exempt
def mark_message_read(request, message_id):
    """Mark a specific message as read — only the recipient can do this"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        message = Message.objects.get(id=message_id, recipient_id=student_id)
        # only find the message if the logged-in student is the recipient
        message.mark_as_read()
        # calls the model method that sets is_read=True and read_at=now

        return Response({
            'message': 'Message marked as read',
            'data': MessageSerializer(message).data
        }, status=status.HTTP_200_OK)
    except Message.DoesNotExist:
        return Response({
            'message': 'Message not found.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@csrf_exempt
def get_conversations(request):
    """Get all conversations grouped by (other_user, room) — like WhatsApp's chat list"""
    from django.db.models import Q, Max, Count
    # Q objects allow complex OR queries — Q(a=1) | Q(b=2) means "a=1 OR b=2"

    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # get every message where this student is either the sender or the recipient
    all_messages = Message.objects.filter(
        Q(sender=student) | Q(recipient=student)
    ).select_related('sender', 'recipient', 'room').order_by('-created_at')
    # ordered newest first so the first message we see for each conversation is the latest

    # group messages into conversations — keyed by (other_user_id, room_id)
    conversations = {}

    for message in all_messages:
        # figure out who the other person is in this message
        other_user = message.recipient if message.sender.id == student_id else message.sender

        # create a unique key for this conversation
        room_id = message.room.id if message.room else None
        conv_key = f"{other_user.id}_{room_id}"

        if conv_key not in conversations:
            # first time seeing this conversation — this message is the latest one
            # count how many unread messages from the other user
            unread_count = Message.objects.filter(
                sender=other_user,
                recipient=student,
                room=message.room,
                is_read=False
            ).count()

            conversations[conv_key] = {
                'other_user': {
                    'id': other_user.id,
                    'name': other_user.name,
                    'email': other_user.email
                },
                'room': {
                    'id': message.room.id,
                    'title': message.room.title
                } if message.room else None,
                'last_message': {
                    'content': message.content,
                    'created_at': message.created_at,
                    'is_from_me': message.sender.id == student_id
                    # helps the frontend show "You: ..." prefix
                },
                'unread_count': unread_count
            }

    # sort conversations by most recent message first
    conversations_list = sorted(
        conversations.values(),
        key=lambda x: x['last_message']['created_at'],
        reverse=True
    )

    return Response({
        'conversations': conversations_list,
        'count': len(conversations_list)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def get_conversation_messages(request):
    """Get all messages in a specific conversation thread between two students about a room"""
    from django.db.models import Q

    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    other_user_id = request.GET.get('other_user_id')
    # from the URL query string: ?other_user_id=3&room_id=5
    room_id = request.GET.get('room_id')

    if not other_user_id:
        return Response({
            'message': 'other_user_id is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = Student.objects.get(id=student_id)
        other_user = Student.objects.get(id=other_user_id)
    except Student.DoesNotExist:
        return Response({
            'message': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # build a Q query to get messages in BOTH directions between these two students
    query = Q(sender=student, recipient=other_user) | Q(sender=other_user, recipient=student)
    # this gets: messages I sent to them AND messages they sent to me

    # optionally filter by room
    if room_id and room_id != 'null':
        try:
            room = Room.objects.get(id=room_id)
            query &= Q(room=room)
            # &= adds an AND condition — messages must also be about this room
        except Room.DoesNotExist:
            return Response({
                'message': 'Room not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    else:
        query &= Q(room__isnull=True)
        # if no room specified, get messages that are not about any room

    # get all messages in chronological order (oldest first for chat display)
    messages = Message.objects.filter(query).select_related('sender', 'recipient', 'room').order_by('created_at')

    # automatically mark all unread messages from the other user as read
    Message.objects.filter(
        sender=other_user,
        recipient=student,
        room_id=room_id if room_id and room_id != 'null' else None,
        is_read=False
    ).update(is_read=True, read_at=timezone.now())
    # bulk update — much faster than looping and calling .save() on each one

    return Response({
        'messages': MessageSerializer(messages, many=True).data,
        'count': messages.count(),
        'other_user': {
            'id': other_user.id,
            'name': other_user.name,
            'email': other_user.email
        }
    }, status=status.HTTP_200_OK)


# ============================================================
# FAVORITES VIEWS
# ============================================================

@api_view(['POST'])
@csrf_exempt
def add_favorite(request):
    """Save a room to the logged-in student's favorites list"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    room_id = request.data.get('room_id')
    if not room_id:
        return Response({
            'message': 'room_id is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = Student.objects.get(id=student_id)
        room = Room.objects.get(id=room_id, is_active=True)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Room.DoesNotExist:
        return Response({
            'message': 'Room not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # get_or_create either finds an existing favorite or creates a new one
    favorite, created = Favorite.objects.get_or_create(
        student=student,
        room=room
    )
    # 'created' is True if a new row was inserted, False if it already existed

    if created:
        return Response({
            'message': 'Room added to favorites!',
            'is_favorited': True
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'message': 'Room is already in favorites.',
            'is_favorited': True
        }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@csrf_exempt
def remove_favorite(request, room_id):
    """Remove a room from the student's favorites"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(id=student_id)
        favorite = Favorite.objects.get(student=student, room_id=room_id)
        favorite.delete()
        # actually remove the row from the favorites table

        return Response({
            'message': 'Room removed from favorites.',
            'is_favorited': False
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Favorite.DoesNotExist:
        return Response({
            'message': 'Room is not in favorites.',
            'is_favorited': False
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@csrf_exempt
def get_favorites(request):
    """Get all rooms the logged-in student has saved as favorites"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # get all favorites for this student, with the room and owner data pre-loaded
    favorites = Favorite.objects.filter(student=student).select_related('room', 'room__owner')
    # select_related joins the room and room.owner tables to avoid N+1 queries

    rooms = [fav.room for fav in favorites if fav.room.is_active]
    # filter out rooms that have been soft-deleted

    return Response({
        'rooms': RoomSerializer(rooms, many=True, context={'request': request}).data,
        'count': len(rooms)
    }, status=status.HTTP_200_OK)


# ============================================================
# REPORTS VIEWS
# ============================================================

@api_view(['POST'])
@csrf_exempt
def create_report(request):
    """Submit a report about a room listing — flags it for admin review"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in to report a room.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # extract the report data from the request body
    room_id = request.data.get('room_id')
    report_type = request.data.get('report_type')
    description = request.data.get('description', '').strip()
    # .strip() removes leading/trailing whitespace

    # manual validation — we did not use a serializer for this view
    if not room_id:
        return Response({
            'message': 'room_id is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not report_type:
        return Response({
            'message': 'report_type is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not description:
        return Response({
            'message': 'description is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # make sure the report_type is one of the allowed options
    valid_types = [choice[0] for choice in Report.REPORT_TYPES]
    # extracts ['scam', 'incorrect', 'inappropriate', ...] from the REPORT_TYPES list
    if report_type not in valid_types:
        return Response({
            'message': f'Invalid report_type. Must be one of: {", ".join(valid_types)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        student = Student.objects.get(id=student_id)
        room = Room.objects.get(id=room_id)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Room.DoesNotExist:
        return Response({
            'message': 'Room not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # create the report — it starts with status='pending' by default (set in the model)
    report = Report.objects.create(
        reporter=student,
        room=room,
        report_type=report_type,
        description=description
    )

    return Response({
        'message': 'Report submitted successfully. We will review it shortly.',
        'report_id': report.id,
        'status': report.status
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@csrf_exempt
def get_my_reports(request):
    """Get all reports submitted by the logged-in student — so they can track their status"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({
            'message': 'Invalid session.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    reports = Report.objects.filter(reporter=student).select_related('room').order_by('-created_at')
    # get all reports by this student, newest first, with room data pre-loaded

    # manually build the response data (we did not create a ReportSerializer)
    reports_data = []
    for report in reports:
        reports_data.append({
            'id': report.id,
            'report_type': report.report_type,
            'report_type_display': report.get_report_type_display(),
            # turns 'scam' into 'Scam/Fraudulent Listing'
            'description': report.description,
            'status': report.status,
            'status_display': report.get_status_display(),
            # turns 'pending' into 'Pending Review'
            'created_at': report.created_at.isoformat(),
            # .isoformat() converts datetime to string like "2024-01-15T10:30:00+00:00"
            'updated_at': report.updated_at.isoformat(),
            'room': {
                'id': report.room.id,
                'title': report.room.title,
                'location': report.room.location,
                'price': report.room.price,
            } if report.room else None
        })

    return Response(reports_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def check_favorite(request, room_id):
    """Check if a specific room is in the logged-in student's favorites — used by the heart icon"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'is_favorited': False
        }, status=status.HTTP_200_OK)
        # not logged in = not favorited

    try:
        is_favorited = Favorite.objects.filter(
            student_id=student_id,
            room_id=room_id
        ).exists()
        # .exists() returns True/False and is faster than .count() > 0

        return Response({
            'is_favorited': is_favorited
        }, status=status.HTTP_200_OK)
    except Exception:
        return Response({
            'is_favorited': False
        }, status=status.HTTP_200_OK)


# ============================================================
# PASSWORD RESET VIEWS
# ============================================================

@api_view(['POST'])
@csrf_exempt
def request_password_reset(request):
    """Handle 'Forgot Password' — generates a token and emails a reset link to the student"""
    email = request.data.get('email', '').strip().lower()

    if not email:
        return Response({
            'message': 'Please provide your email address.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # always return the same success message whether the email exists or not
    # this prevents attackers from finding out which emails are registered (email enumeration)
    success_msg = 'If an account exists with that email, a reset link has been sent.'

    try:
        student = Student.objects.get(email=email)
    except Student.DoesNotExist:
        # email not found — but we still return success to avoid leaking information
        return Response({'message': success_msg}, status=status.HTTP_200_OK)

    try:
        # invalidate any old unused tokens for this student
        PasswordResetToken.objects.filter(student=student, used=False).update(used=True)
        # marks all previous tokens as used so only the new one works

        # create a fresh token with a random UUID
        token = PasswordResetToken.objects.create(student=student)
    except Exception as e:
        logger.error(f"[Password Reset] DB error creating token: {type(e).__name__}: {e}")
        return Response({
            'message': 'Something went wrong. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # build the reset link — the student clicks this in their email
    domain = django_settings.SITE_DOMAIN
    # SITE_DOMAIN is set in settings.py, e.g. "arwin001.pythonanywhere.com"
    reset_url = f"https://{domain}/reset-password.html?token={token.token}"
    # the URL includes the UUID token as a query parameter

    # send the email via Gmail REST API (HTTPS, not SMTP — because PythonAnywhere blocks SMTP)
    try:
        gmail_send(
            to=student.email,
            subject='StudentNest \u2014 Reset Your Password',
            body=(
                f"Hi {student.name},\n\n"
                f"We received a request to reset your password.\n\n"
                f"Click the link below to create a new password:\n"
                f"{reset_url}\n\n"
                f"This link expires in 1 hour.\n\n"
                f"If you didn't request this, you can safely ignore this email.\n\n"
                f"\u2014 The StudentNest Team"
            ),
        )
    except Exception as e:
        logger.error(f"[Password Reset] Email send failed: {type(e).__name__}: {e}")
        return Response({
            'message': f'Email could not be sent ({type(e).__name__}). This may be a server restriction.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': success_msg}, status=status.HTTP_200_OK)


@api_view(['POST'])
@csrf_exempt
def reset_password(request):
    """Set a new password using a valid reset token — called from the reset password page"""
    token_str = request.data.get('token', '').strip()
    new_password = request.data.get('password', '')

    if not token_str or not new_password:
        return Response({
            'message': 'Token and new password are required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({
            'message': 'Password must be at least 8 characters.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = PasswordResetToken.objects.get(token=token_str, used=False)
        # look up the token — must exist and must not have been used already
    except PasswordResetToken.DoesNotExist:
        return Response({
            'message': 'This reset link is invalid or has already been used.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if token.is_expired():
        # check if more than 1 hour has passed since the token was created
        return Response({
            'message': 'This reset link has expired. Please request a new one.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # everything is valid — update the password
    student = token.student
    student.set_password(new_password)
    # hash the new password using PBKDF2
    student.save(update_fields=['password_hash'])

    # mark the token as used so it cannot be reused
    token.used = True
    token.save(update_fields=['used'])

    return Response({
        'message': 'Your password has been reset successfully! You can now log in.'
    }, status=status.HTTP_200_OK)

