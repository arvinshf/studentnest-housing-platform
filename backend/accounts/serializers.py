from rest_framework import serializers
# serializers convert Python objects to JSON and validate incoming JSON data
# they sit between the API views and the database models

from .models import Student, Room, Message
# import our custom models from models.py in the same directory

import re
# regular expressions — used here to validate that student IDs are exactly 8 digits


# ============================================================
# SIGNUP SERIALIZER — validates and creates a new student account
# ============================================================
class StudentSignupSerializer(serializers.ModelSerializer):
    # ModelSerializer automatically creates fields based on the Student model
    # but we add these two manually because they are not stored in the model as-is

    password = serializers.CharField(write_only=True, min_length=12)
    # write_only=True means this field is accepted in POST requests but never returned in responses
    # min_length=12 enforces at least 12 characters

    password_confirm = serializers.CharField(write_only=True)
    # used to make sure the user typed the same password twice

    class Meta:
        model = Student
        # tells DRF which model this serializer maps to

        fields = ['name', 'email', 'student_id', 'course', 'phone', 'city', 'password', 'password_confirm']
        # the fields that the frontend must send in the JSON body

    def validate_name(self, value):
        # field-level validator — Django calls this automatically for the 'name' field
        if len(value) < 3:
            raise serializers.ValidationError("Name must be at least 3 characters.")
        return value

    def validate_email(self, value):
        # check if another student already has this email
        if Student.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()
        # always store emails in lowercase to avoid duplicates like "John@Gmail.com" vs "john@gmail.com"

    def validate_student_id(self, value):
        if not re.match(r'^\d{8}$', value):
            # ^\d{8}$ means: start, exactly 8 digits, end — nothing else allowed
            raise serializers.ValidationError("Student ID must be exactly 8 digits.")
        return value

    def validate_course(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Please enter your course.")
        return value

    def validate(self, data):
        # object-level validator — runs after all field-level validators pass
        # this is the right place to compare two fields against each other
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def create(self, validated_data):
        # called when serializer.save() is used in the view
        validated_data.pop('password_confirm')
        # remove password_confirm — we don't store it

        password = validated_data.pop('password')
        # take the raw password out of the data

        student = Student(**validated_data)
        # create a Student instance with the remaining fields (name, email, student_id, course, etc.)

        student.set_password(password)
        # hash the password — never store raw passwords

        student.save()
        # insert the new row into the students table

        return student


# ============================================================
# LOGIN SERIALIZER — just validates the email and password fields
# ============================================================
class StudentLoginSerializer(serializers.Serializer):
    # plain Serializer (not ModelSerializer) because login does not create or update a record
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    # the actual authentication logic is in the login view, not here


# ============================================================
# STUDENT SERIALIZER — used for returning student profile data
# ============================================================
class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'email', 'student_id', 'course', 'created_at']
        # only expose safe fields — password_hash is intentionally left out


# ============================================================
# ROOM SERIALIZER — for reading room data (GET requests)
# ============================================================
class RoomSerializer(serializers.ModelSerializer):
    # these are extra read-only fields that pull data from related models
    owner_name = serializers.CharField(source='owner.name', read_only=True)
    # source='owner.name' means: follow the ForeignKey to Student and grab the name field

    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    images = serializers.SerializerMethodField()
    # SerializerMethodField calls get_images() to compute its value

    features = serializers.SerializerMethodField()
    # calls get_features() to build a list of amenities

    # individual image URL fields — each calls its own get_image_X_url method
    image_1_url = serializers.SerializerMethodField()
    image_2_url = serializers.SerializerMethodField()
    image_3_url = serializers.SerializerMethodField()
    image_4_url = serializers.SerializerMethodField()
    image_5_url = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'owner', 'owner_name', 'owner_email',
            'title', 'description', 'location', 'postcode', 'distance_to_transport',
            'price', 'deposit', 'bills',
            'room_type', 'furnished', 'available_from', 'min_stay_months', 'max_stay_months',
            'image_1', 'image_2', 'image_3', 'image_4', 'image_5',
            'image_1_url', 'image_2_url', 'image_3_url', 'image_4_url', 'image_5_url',
            'images', 'features',
            'wifi', 'washing_machine', 'dishwasher', 'parking', 'garden',
            'gym', 'central_heating', 'double_glazing', 'security_system', 'bike_storage',
            'is_active', 'is_featured', 'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['owner', 'is_featured', 'is_verified', 'created_at', 'updated_at']
        # these fields cannot be changed by the user through the API

    def get_image_1_url(self, obj):
        """Build the full absolute URL for image_1"""
        if obj.image_1:
            request = self.context.get('request')
            # self.context['request'] is the current HTTP request, passed by the view
            if request:
                return request.build_absolute_uri(obj.image_1.url)
                # turns "/media/room_images/photo.jpg" into "https://arwin001.pythonanywhere.com/media/room_images/photo.jpg"
        return None

    def get_image_2_url(self, obj):
        if obj.image_2:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_2.url)
        return None

    def get_image_3_url(self, obj):
        if obj.image_3:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_3.url)
        return None

    def get_image_4_url(self, obj):
        if obj.image_4:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_4.url)
        return None

    def get_image_5_url(self, obj):
        if obj.image_5:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_5.url)
        return None

    def get_images(self, obj):
        """Return a list of all non-empty image URLs as absolute paths"""
        request = self.context.get('request')
        images = []
        for i in range(1, 6):
            image_field = getattr(obj, f'image_{i}')
            # dynamically access image_1, image_2, etc.
            if image_field:
                if request:
                    images.append(request.build_absolute_uri(image_field.url))
                else:
                    images.append(image_field.url)
        return images

    def get_features(self, obj):
        """Build a list of active amenities with their icons and display names"""
        features = []
        feature_mapping = {
            'wifi': {'icon': '📶', 'name': 'WiFi'},
            'washing_machine': {'icon': '🧺', 'name': 'Washing Machine'},
            'dishwasher': {'icon': '🍽️', 'name': 'Dishwasher'},
            'parking': {'icon': '🚗', 'name': 'Parking'},
            'garden': {'icon': '🌳', 'name': 'Garden'},
            'gym': {'icon': '🏋️', 'name': 'Gym'},
            'central_heating': {'icon': '🔥', 'name': 'Central Heating'},
            'double_glazing': {'icon': '🪟', 'name': 'Double Glazing'},
            'security_system': {'icon': '🔒', 'name': 'Security System'},
            'bike_storage': {'icon': '🚴', 'name': 'Bike Storage'},
        }
        # maps each boolean field name to a display-friendly dict

        for field, display in feature_mapping.items():
            if getattr(obj, field, False):
                # check if that boolean field is True on this room
                features.append(display)

        return features
        # the frontend uses this to show amenity badges on the room card


# ============================================================
# ROOM CREATE SERIALIZER — for creating/updating rooms (POST/PUT)
# ============================================================
class RoomCreateSerializer(serializers.ModelSerializer):
    # simpler than RoomSerializer — only includes writable fields
    class Meta:
        model = Room
        fields = [
            'title', 'description', 'location', 'postcode', 'distance_to_transport',
            'price', 'deposit', 'bills',
            'room_type', 'furnished', 'available_from', 'min_stay_months', 'max_stay_months',
            'image_1', 'image_2', 'image_3', 'image_4', 'image_5',
            'wifi', 'washing_machine', 'dishwasher', 'parking', 'garden',
            'gym', 'central_heating', 'double_glazing', 'security_system', 'bike_storage',
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        if value > 10000:
            raise serializers.ValidationError("Price seems too high.")
            # basic sanity check to catch typos like 100000
        return value

    def validate_deposit(self, value):
        if value < 0:
            raise serializers.ValidationError("Deposit cannot be negative.")
        return value


# ============================================================
# MESSAGE SERIALIZER — for reading messages (GET)
# ============================================================
class MessageSerializer(serializers.ModelSerializer):
    # pull in names and emails from the related Student objects
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    recipient_name = serializers.CharField(source='recipient.name', read_only=True)
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)
    room_title = serializers.CharField(source='room.title', read_only=True)
    # source='room.title' follows the ForeignKey to Room and grabs title

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'sender_email',
            'recipient', 'recipient_name', 'recipient_email',
            'room', 'room_title',
            'subject', 'content',
            'is_read', 'read_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['sender', 'is_read', 'read_at', 'created_at', 'updated_at']
        # sender is set by the view (from the session), not from the request body

    def validate_subject(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Subject must be at least 3 characters.")
        return value

    def validate_content(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters.")
        return value


# ============================================================
# MESSAGE CREATE SERIALIZER — for sending a new message (POST)
# ============================================================
class MessageCreateSerializer(serializers.Serializer):
    # plain Serializer — we handle creation manually in the view
    room_id = serializers.IntegerField()
    # the room this message is about — used to look up the room owner

    subject = serializers.CharField()
    content = serializers.CharField(style={'base_template': 'textarea.html'})
    # style is only for the DRF browsable API — makes the field render as a textarea

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value
