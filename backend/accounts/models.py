from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone


class Student(models.Model):
    """Student user model for StudentNest"""
    
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    student_id = models.CharField(max_length=8)
    course = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    password_hash = models.CharField(max_length=255)
    is_online = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'students'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check if the provided password matches the stored hash"""
        return check_password(raw_password, self.password_hash)
    
    def is_active_now(self):
        """Check if user was active in the last 5 minutes"""
        if not self.last_activity:
            return False
        return (timezone.now() - self.last_activity).seconds < 300
    
    def mark_online(self):
        """Mark student as online and update activity"""
        self.is_online = True
        self.last_activity = timezone.now()
        self.save(update_fields=['is_online', 'last_activity'])
    
    def mark_offline(self):
        """Mark student as offline"""
        self.is_online = False
        self.save(update_fields=['is_online'])


class Room(models.Model):
    """Room listing model for StudentNest"""
    
    ROOM_TYPE_CHOICES = [
        ('single', 'Single Room'),
        ('double', 'Double Room'),
        ('ensuite', 'Ensuite Room'),
        ('studio', 'Studio'),
        ('shared', 'Shared Room'),
    ]
    
    FURNISHED_CHOICES = [
        ('fully', 'Fully Furnished'),
        ('part', 'Part Furnished'),
        ('unfurnished', 'Unfurnished'),
    ]
    
    BILLS_CHOICES = [
        ('included', 'Included'),
        ('not_included', 'Not Included'),
        ('partial', 'Partially Included'),
    ]

    # Owner
    owner = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='rooms')
    
    # Basic Information
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=200)
    postcode = models.CharField(max_length=20, blank=True)
    distance_to_transport = models.CharField(max_length=100)
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2)
    bills = models.CharField(max_length=20, choices=BILLS_CHOICES)
    
    # Room Details
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    furnished = models.CharField(max_length=20, choices=FURNISHED_CHOICES)
    available_from = models.DateField()
    min_stay_months = models.IntegerField(default=6)
    max_stay_months = models.IntegerField(default=12)
    
    # Images (uploaded files)
    image_1 = models.ImageField(upload_to='room_images/', max_length=500)
    image_2 = models.ImageField(upload_to='room_images/', max_length=500, blank=True, null=True)
    image_3 = models.ImageField(upload_to='room_images/', max_length=500, blank=True, null=True)
    image_4 = models.ImageField(upload_to='room_images/', max_length=500, blank=True, null=True)
    image_5 = models.ImageField(upload_to='room_images/', max_length=500, blank=True, null=True)
    
    # Features (Boolean fields for amenities)
    wifi = models.BooleanField(default=False)
    washing_machine = models.BooleanField(default=False)
    dishwasher = models.BooleanField(default=False)
    parking = models.BooleanField(default=False)
    garden = models.BooleanField(default=False)
    gym = models.BooleanField(default=False)
    central_heating = models.BooleanField(default=False)
    double_glazing = models.BooleanField(default=False)
    security_system = models.BooleanField(default=False)
    bike_storage = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - £{self.price}/month"
    
    def get_images(self):
        """Return list of non-empty image file paths"""
        images = []
        for i in range(1, 6):
            img = getattr(self, f'image_{i}')
            if img:
                images.append(img.url if hasattr(img, 'url') else str(img))
        return images

    class Meta:
        db_table = 'rooms'
        ordering = ['-created_at']


class Message(models.Model):
    """Message model for communication between students and landlords"""
    
    # Sender and recipient
    sender = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='received_messages')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    
    # Message content
    subject = models.CharField(max_length=200)
    content = models.TextField()
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"From {self.sender.name} to {self.recipient.name}: {self.subject}"
    
    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class Favorite(models.Model):
    """Favorite model to track rooms that students have saved"""
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='favorites')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'favorites'
        ordering = ['-created_at']
        unique_together = ('student', 'room')  # Prevent duplicate favorites
    
    def __str__(self):
        return f"{self.student.name} favorited {self.room.title}"


class Report(models.Model):
    """Model for room reports"""
    REPORT_TYPES = [
        ('scam', 'Scam/Fraudulent Listing'),
        ('incorrect', 'Incorrect Information'),
        ('inappropriate', 'Inappropriate Content'),
        ('duplicate', 'Duplicate Listing'),
        ('unavailable', 'Property No Longer Available'),
        ('discrimination', 'Discriminatory Content'),
        ('safety', 'Safety Concerns'),
        ('other', 'Other Issue'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    reporter = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='reports_made')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    description = models.TextField(help_text='Detailed description of the issue')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, help_text='Internal admin notes')
    
    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['reporter', '-created_at']),
            models.Index(fields=['room', '-created_at']),
        ]
    
    def __str__(self):
        return f"Report by {self.reporter.name} - {self.get_report_type_display()} ({self.status})"
    
    def mark_reviewed(self, new_status, notes=''):
        """Mark report as reviewed with status update"""
        self.status = new_status
        self.reviewed_at = timezone.now()
        if notes:
            self.admin_notes = notes
        self.save()
