from rest_framework import serializers
from .models import Student, Room, Message
import re


class StudentSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=12)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = Student
        fields = ['name', 'email', 'student_id', 'course', 'phone', 'city', 'password', 'password_confirm']
    
    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Name must be at least 3 characters.")
        return value
    
    def validate_email(self, value):
        if Student.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()
    
    def validate_student_id(self, value):
        if not re.match(r'^\d{8}$', value):
            raise serializers.ValidationError("Student ID must be exactly 8 digits.")
        return value
    
    def validate_course(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Please enter your course.")
        return value
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        student = Student(**validated_data)
        student.set_password(password)
        student.save()
        
        return student


class StudentLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'email', 'student_id', 'course', 'created_at']


class RoomSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    images = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
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
    
    def get_image_1_url(self, obj):
        if obj.image_1:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_1.url)
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
        request = self.context.get('request')
        images = []
        for i in range(1, 6):
            image_field = getattr(obj, f'image_{i}')
            if image_field:
                if request:
                    images.append(request.build_absolute_uri(image_field.url))
                else:
                    images.append(image_field.url)
        return images
    
    def get_features(self, obj):
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
        
        for field, display in feature_mapping.items():
            if getattr(obj, field, False):
                features.append(display)
        
        return features


class RoomCreateSerializer(serializers.ModelSerializer):
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
        return value
    
    def validate_deposit(self, value):
        if value < 0:
            raise serializers.ValidationError("Deposit cannot be negative.")
        return value


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    recipient_name = serializers.CharField(source='recipient.name', read_only=True)
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)
    room_title = serializers.CharField(source='room.title', read_only=True)
    
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
    
    def validate_subject(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Subject must be at least 3 characters.")
        return value
    
    def validate_content(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters.")
        return value


class MessageCreateSerializer(serializers.Serializer):
    room_id = serializers.IntegerField()
    subject = serializers.CharField()
    content = serializers.CharField(style={'base_template': 'textarea.html'})
    
    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value
