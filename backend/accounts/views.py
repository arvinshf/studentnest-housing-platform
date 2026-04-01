from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.utils import timezone
from .models import Student, Room, Message, Favorite, Report
from .serializers import StudentSignupSerializer, StudentLoginSerializer, StudentSerializer, RoomSerializer, RoomCreateSerializer, MessageSerializer, MessageCreateSerializer


@api_view(['POST'])
@csrf_exempt
def signup(request):
    """Handle student signup"""
    serializer = StudentSignupSerializer(data=request.data)
    
    if serializer.is_valid():
        student = serializer.save()
        
        # Set session and mark online
        request.session['student_id'] = student.id
        request.session['student_email'] = student.email
        
        student.is_online = True
        student.last_login = timezone.now()
        student.last_activity = timezone.now()
        student.save(update_fields=['is_online', 'last_login', 'last_activity'])
        
        return Response({
            'message': 'Account created successfully!',
            'student': StudentSerializer(student).data
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'message': 'Validation failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@csrf_exempt
def login(request):
    """Handle student login"""
    serializer = StudentLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'message': 'Invalid input',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email'].lower()
    password = serializer.validated_data['password']
    
    try:
        student = Student.objects.get(email=email)
    except Student.DoesNotExist:
        return Response({
            'message': 'No account found with this email.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if not student.check_password(password):
        return Response({
            'message': 'Incorrect password.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Set session and mark online
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
    """Handle student logout"""
    student_id = request.session.get('student_id')
    
    # Mark user as offline
    if student_id:
        try:
            student = Student.objects.get(id=student_id)
            student.is_online = False
            student.save(update_fields=['is_online'])
        except Student.DoesNotExist:
            pass
    
    request.session.flush()
    return Response({
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def check_session(request):
    """Check if user is logged in and update activity"""
    student_id = request.session.get('student_id')
    
    if not student_id:
        return Response({
            'authenticated': False
        }, status=status.HTTP_200_OK)
    
    try:
        student = Student.objects.get(id=student_id)
        
        # Update last activity
        student.last_activity = timezone.now()
        if not student.is_online:
            student.is_online = True
        student.save(update_fields=['last_activity', 'is_online'])
        
        return Response({
            'authenticated': True,
            'student': StudentSerializer(student).data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        request.session.flush()
        return Response({
            'authenticated': False
        }, status=status.HTTP_200_OK)


# ============ ROOM MANAGEMENT VIEWS ============

@api_view(['GET', 'POST'])
@csrf_exempt
def room_list_create(request):
    """List all rooms or create a new room"""
    
    if request.method == 'GET':
        # Get all active rooms
        rooms = Room.objects.filter(is_active=True)
        serializer = RoomSerializer(rooms, many=True, context={'request': request})
        return Response({
            'rooms': serializer.data,
            'count': rooms.count()
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        # Check if user is logged in
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
        
        # Create room
        serializer = RoomCreateSerializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save(owner=student)
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
    """Get, update or delete a specific room"""
    
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({
            'message': 'Room not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = RoomSerializer(room, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method in ['PUT', 'DELETE']:
        # Check if user owns this room
        student_id = request.session.get('student_id')
        if not student_id or room.owner.id != student_id:
            return Response({
                'message': 'You do not have permission to modify this room.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'PUT':
            serializer = RoomCreateSerializer(room, data=request.data, partial=True)
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
            return Response({
                'message': 'Room deleted successfully!'
            }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def my_rooms(request):
    """Get all rooms posted by the logged-in user"""
    student_id = request.session.get('student_id')
    
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    rooms = Room.objects.filter(owner_id=student_id, is_active=True)
    serializer = RoomSerializer(rooms, many=True, context={'request': request})
    
    return Response({
        'rooms': serializer.data,
        'count': rooms.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def online_users(request):
    """Get all currently online users"""
    # Get users who are marked online and have been active in last 10 minutes
    from datetime import timedelta
    cutoff_time = timezone.now() - timedelta(minutes=10)
    
    online_students = Student.objects.filter(
        is_online=True,
        last_activity__gte=cutoff_time
    ).values('id', 'name', 'email', 'last_activity', 'last_login')
    
    return Response({
        'online_users': list(online_students),
        'count': online_students.count()
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@csrf_exempt
def send_message(request):
    """Send a message to a room owner or reply to a message"""
    # Check if user is logged in
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
    
    # Check if recipient_id is provided (for replies)
    recipient_id = request.data.get('recipient_id')
    
    if recipient_id:
        # Direct message to specific user (reply)
        try:
            recipient = Student.objects.get(id=recipient_id)
        except Student.DoesNotExist:
            return Response({
                'message': 'Recipient not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get the room if provided
        room_id = serializer.validated_data.get('room_id')
        room = None
        if room_id:
            try:
                room = Room.objects.get(id=room_id)
            except Room.DoesNotExist:
                pass
    else:
        # Message to room owner
        room_id = serializer.validated_data['room_id']
        try:
            room = Room.objects.get(id=room_id, is_active=True)
            recipient = room.owner
        except Room.DoesNotExist:
            return Response({
                'message': 'Room not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    # Don't allow sending message to yourself
    if sender.id == recipient.id:
        return Response({
            'message': 'You cannot send a message to yourself.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create the message
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
    """Get all messages for the logged-in user (received messages)"""
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
    
    # Get all messages where the user is the recipient
    messages = Message.objects.filter(recipient=student).select_related('sender', 'room')
    
    return Response({
        'messages': MessageSerializer(messages, many=True).data,
        'count': messages.count(),
        'unread_count': messages.filter(is_read=False).count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def get_sent_messages(request):
    """Get all messages sent by the logged-in user"""
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
    
    # Get all messages where the user is the sender
    messages = Message.objects.filter(sender=student).select_related('recipient', 'room')
    
    return Response({
        'messages': MessageSerializer(messages, many=True).data,
        'count': messages.count()
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@csrf_exempt
def mark_message_read(request, message_id):
    """Mark a message as read"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        message = Message.objects.get(id=message_id, recipient_id=student_id)
        message.mark_as_read()
        
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
    """Get all conversations grouped by (other_user, room)"""
    from django.db.models import Q, Max, Count
    
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
    
    # Get all messages where user is sender or recipient
    all_messages = Message.objects.filter(
        Q(sender=student) | Q(recipient=student)
    ).select_related('sender', 'recipient', 'room').order_by('-created_at')
    
    # Group messages by conversation (other_user + room)
    conversations = {}
    
    for message in all_messages:
        # Determine the other user in the conversation
        other_user = message.recipient if message.sender.id == student_id else message.sender
        
        # Create a unique key for this conversation
        room_id = message.room.id if message.room else None
        conv_key = f"{other_user.id}_{room_id}"
        
        if conv_key not in conversations:
            # Count unread messages in this conversation
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
                },
                'unread_count': unread_count
            }
    
    # Convert to list and sort by last message time
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
    """Get all messages in a specific conversation"""
    from django.db.models import Q
    
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    other_user_id = request.GET.get('other_user_id')
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
    
    # Build query for messages between these two users
    query = Q(sender=student, recipient=other_user) | Q(sender=other_user, recipient=student)
    
    # Add room filter if provided
    if room_id and room_id != 'null':
        try:
            room = Room.objects.get(id=room_id)
            query &= Q(room=room)
        except Room.DoesNotExist:
            return Response({
                'message': 'Room not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    else:
        query &= Q(room__isnull=True)
    
    # Get all messages in this conversation, ordered chronologically
    messages = Message.objects.filter(query).select_related('sender', 'recipient', 'room').order_by('created_at')
    
    # Mark all unread messages from other_user as read
    Message.objects.filter(
        sender=other_user,
        recipient=student,
        room_id=room_id if room_id and room_id != 'null' else None,
        is_read=False
    ).update(is_read=True, read_at=timezone.now())
    
    return Response({
        'messages': MessageSerializer(messages, many=True).data,
        'count': messages.count(),
        'other_user': {
            'id': other_user.id,
            'name': other_user.name,
            'email': other_user.email
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@csrf_exempt
def add_favorite(request):
    """Add a room to user's favorites"""
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
    
    # Check if already favorited
    favorite, created = Favorite.objects.get_or_create(
        student=student,
        room=room
    )
    
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
    """Remove a room from user's favorites"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        student = Student.objects.get(id=student_id)
        favorite = Favorite.objects.get(student=student, room_id=room_id)
        favorite.delete()
        
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
    """Get all favorite rooms for the logged-in user"""
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
    
    # Get all favorite rooms
    favorites = Favorite.objects.filter(student=student).select_related('room', 'room__owner')
    rooms = [fav.room for fav in favorites if fav.room.is_active]
    
    return Response({
        'rooms': RoomSerializer(rooms, many=True, context={'request': request}).data,
        'count': len(rooms)
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@csrf_exempt
def create_report(request):
    """Create a new report for a room - @csrf_exempt ensures no CSRF issues"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'message': 'You must be logged in to report a room.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    room_id = request.data.get('room_id')
    report_type = request.data.get('report_type')
    description = request.data.get('description', '').strip()
    
    # Validation
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
    
    valid_types = [choice[0] for choice in Report.REPORT_TYPES]
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
    
    # Create the report
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
    """Get all reports created by the logged-in user - @csrf_exempt ensures no CSRF issues"""
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
    
    reports_data = []
    for report in reports:
        reports_data.append({
            'id': report.id,
            'report_type': report.report_type,
            'report_type_display': report.get_report_type_display(),
            'description': report.description,
            'status': report.status,
            'status_display': report.get_status_display(),
            'created_at': report.created_at.isoformat(),
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
    """Check if a room is favorited by the logged-in user"""
    student_id = request.session.get('student_id')
    if not student_id:
        return Response({
            'is_favorited': False
        }, status=status.HTTP_200_OK)
    
    try:
        is_favorited = Favorite.objects.filter(
            student_id=student_id,
            room_id=room_id
        ).exists()
        
        return Response({
            'is_favorited': is_favorited
        }, status=status.HTTP_200_OK)
    except Exception:
        return Response({
            'is_favorited': False
        }, status=status.HTTP_200_OK)

