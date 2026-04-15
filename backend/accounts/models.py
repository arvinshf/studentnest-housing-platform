from django.db import models
# models is Django's ORM — lets us define database tables as Python classes

from django.contrib.auth.hashers import make_password, check_password
# make_password hashes a raw password string using PBKDF2 + SHA256
# check_password compares a raw password against a stored hash

from django.utils import timezone
# timezone.now() gives the current time in UTC

import uuid
# uuid generates unique random identifiers — used for password reset tokens


class Student(models.Model):
    """Student user model for StudentNest — this is our custom user table,
    separate from Django's built-in User model which we only use for admin login."""

    name = models.CharField(max_length=200)
    # the student's full name, up to 200 characters

    email = models.EmailField(unique=True)
    # their email address — unique=True means no two students can have the same email

    student_id = models.CharField(max_length=8)
    # their 8-digit university student ID

    course = models.CharField(max_length=200)
    # what course they are studying

    phone = models.CharField(max_length=20, blank=True, null=True)
    # phone number — optional (blank=True for forms, null=True for database)

    city = models.CharField(max_length=100, blank=True, null=True)
    # city of residence — also optional

    password_hash = models.CharField(max_length=255)
    # stores the hashed password — never the raw password
    # looks like "pbkdf2_sha256$870000$salt$hash..."

    is_online = models.BooleanField(default=False)
    # tracks whether the student is currently active on the site

    last_login = models.DateTimeField(null=True, blank=True)
    # when they last logged in

    last_activity = models.DateTimeField(null=True, blank=True)
    # when they last did anything (updated on every page load)

    created_at = models.DateTimeField(auto_now_add=True)
    # automatically set to the current time when the student record is first created

    updated_at = models.DateTimeField(auto_now=True)
    # automatically updated to the current time every time the record is saved

    class Meta:
        db_table = 'students'
        # the actual name of the table in PostgreSQL/SQLite

        ordering = ['-created_at']
        # default ordering — newest students first (the minus sign means descending)

    def __str__(self):
        return f"{self.name} ({self.email})"
        # how this object appears in the admin panel and in print statements

    def set_password(self, raw_password):
        """Hash and set the password using Django's PBKDF2 hasher"""
        self.password_hash = make_password(raw_password)
        # takes "MyPassword123!" and turns it into an irreversible hash

    def check_password(self, raw_password):
        """Check if the provided password matches the stored hash"""
        return check_password(raw_password, self.password_hash)
        # hashes the input and compares it to the stored hash — returns True or False

    def is_active_now(self):
        """Check if user was active in the last 5 minutes"""
        if not self.last_activity:
            return False
        return (timezone.now() - self.last_activity).seconds < 300
        # 300 seconds = 5 minutes

    def mark_online(self):
        """Mark student as online and update activity timestamp"""
        self.is_online = True
        self.last_activity = timezone.now()
        self.save(update_fields=['is_online', 'last_activity'])
        # update_fields tells Django to only update these two columns, not the whole row

    def mark_offline(self):
        """Mark student as offline"""
        self.is_online = False
        self.save(update_fields=['is_online'])


class Room(models.Model):
    """Room listing model — each row is one room posted by a student landlord."""

    # these are dropdown choices — the first value goes in the DB, the second is the display label
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

    # --- Owner ---
    owner = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='rooms')
    # ForeignKey links this room to a Student — CASCADE means if the student is deleted, their rooms go too
    # related_name='rooms' lets us do student.rooms.all() to get all rooms owned by that student

    # --- Basic Information ---
    title = models.CharField(max_length=200)
    # listing title shown on the card, e.g. "Spacious Double Room near campus"

    description = models.TextField()
    # full description — TextField has no character limit (unlike CharField)

    location = models.CharField(max_length=200)
    # the area or address, e.g. "Mile End, London"

    postcode = models.CharField(max_length=20, blank=True)
    # UK postcode — optional (blank=True means the form can leave it empty)

    distance_to_transport = models.CharField(max_length=100)
    # e.g. "5 min walk to Mile End station"

    # --- Pricing ---
    price = models.DecimalField(max_digits=10, decimal_places=2)
    # monthly rent — DecimalField avoids floating point rounding issues with money

    deposit = models.DecimalField(max_digits=10, decimal_places=2)
    # upfront deposit amount

    bills = models.CharField(max_length=20, choices=BILLS_CHOICES)
    # whether bills are included in the rent — limited to the BILLS_CHOICES options

    # --- Room Details ---
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    # single, double, ensuite, etc.

    furnished = models.CharField(max_length=20, choices=FURNISHED_CHOICES)
    # fully, part, or unfurnished

    available_from = models.DateField()
    # the date the room becomes available

    min_stay_months = models.IntegerField(default=6)
    # minimum contract length in months

    max_stay_months = models.IntegerField(default=12)
    # maximum contract length in months

    # --- Images ---
    image_1 = models.ImageField(upload_to='room_images/', max_length=500)
    # the main image — required — uploaded files go to MEDIA_ROOT/room_images/

    image_2 = models.ImageField(upload_to='room_images/', max_length=500, blank=True, null=True)
    # additional images 2-5 are all optional

    image_3 = models.ImageField(upload_to='room_images/', max_length=500, blank=True, null=True)
    image_4 = models.ImageField(upload_to='room_images/', max_length=500, blank=True, null=True)
    image_5 = models.ImageField(upload_to='room_images/', max_length=500, blank=True, null=True)

    # --- Features (amenity checkboxes) ---
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
    # all default to False — the frontend sends True for each ticked checkbox

    # --- Status flags ---
    is_active = models.BooleanField(default=True)
    # False means the listing has been deactivated (hidden from search)

    is_featured = models.BooleanField(default=False)
    # True means it appears in the featured section at the top

    is_verified = models.BooleanField(default=False)
    # True means an admin has verified the listing is legitimate

    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - £{self.price}/month"
        # displayed in the admin panel, e.g. "Spacious Double Room - £650.00/month"

    def get_images(self):
        """Return a list of image URLs for all non-empty image fields"""
        images = []
        for i in range(1, 6):
            # loop through image_1 to image_5
            img = getattr(self, f'image_{i}')
            # getattr dynamically gets self.image_1, self.image_2, etc.
            if img:
                images.append(img.url if hasattr(img, 'url') else str(img))
                # .url gives the web-accessible path like /media/room_images/photo.jpg
        return images

    class Meta:
        db_table = 'rooms'
        # the actual table name in the database

        ordering = ['-created_at']
        # newest rooms first by default


class Message(models.Model):
    """Message model — lets students send messages to room owners and vice versa."""

    # who sent it and who receives it
    sender = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='sent_messages')
    # related_name='sent_messages' lets us do student.sent_messages.all()

    recipient = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='received_messages')
    # related_name='received_messages' lets us do student.received_messages.all()

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    # links the message to a specific room listing — optional because some messages might be general

    # message content
    subject = models.CharField(max_length=200)
    # the subject line of the message

    content = models.TextField()
    # the actual message body — no character limit

    # read status
    is_read = models.BooleanField(default=False)
    # starts as unread — gets set to True when the recipient opens it

    read_at = models.DateTimeField(null=True, blank=True)
    # the exact time the message was read — null until it is actually opened

    # timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    # when the message was sent

    updated_at = models.DateTimeField(auto_now=True)
    # when the record was last modified

    class Meta:
        db_table = 'messages'
        ordering = ['-created_at']
        # newest messages first

    def __str__(self):
        return f"From {self.sender.name} to {self.recipient.name}: {self.subject}"

    def mark_as_read(self):
        """Mark this message as read and record the time"""
        if not self.is_read:
            # only update if it hasn't been read yet
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
            # only update these two columns in the database, not the whole row


class Favorite(models.Model):
    """Favorite model — tracks which rooms a student has saved/bookmarked."""

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='favorites')
    # the student who saved this room

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='favorited_by')
    # the room that was saved — related_name lets us do room.favorited_by.all()

    created_at = models.DateTimeField(auto_now_add=True)
    # when they saved it

    class Meta:
        db_table = 'favorites'
        ordering = ['-created_at']

        unique_together = ('student', 'room')
        # this constraint means a student can only favorite a room once
        # trying to add the same room twice would raise an IntegrityError


    def __str__(self):
        return f"{self.student.name} favorited {self.room.title}"


class Report(models.Model):
    """Model for room reports — when a student flags a listing for issues."""

    # dropdown choices for what type of problem is being reported
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

    # what stage the report is at in the admin review process
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]

    reporter = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='reports_made')
    # the student who submitted the report

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reports')
    # the room being reported

    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    # which category — limited to the REPORT_TYPES options above

    description = models.TextField(help_text='Detailed description of the issue')
    # free-text explanation of the problem — help_text shows in the admin form

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    # starts as 'pending' — admin changes it as they review

    created_at = models.DateTimeField(auto_now_add=True)
    # when the report was submitted

    updated_at = models.DateTimeField(auto_now=True)
    # last modified

    reviewed_at = models.DateTimeField(null=True, blank=True)
    # when an admin reviewed it — null until that happens

    admin_notes = models.TextField(blank=True, help_text='Internal admin notes')
    # private notes that only admins can see — not shown to the student
    
    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
        # newest reports first

        indexes = [
            models.Index(fields=['status', '-created_at']),
            # speeds up queries that filter by status and sort by date

            models.Index(fields=['reporter', '-created_at']),
            # speeds up "show me all reports I submitted"

            models.Index(fields=['room', '-created_at']),
            # speeds up "show me all reports for this room"
        ]

    def __str__(self):
        return f"Report by {self.reporter.name} - {self.get_report_type_display()} ({self.status})"
        # get_report_type_display() converts 'scam' to 'Scam/Fraudulent Listing'

    def mark_reviewed(self, new_status, notes=''):
        """Mark this report as reviewed — called by admin actions"""
        self.status = new_status
        # e.g. 'resolved' or 'dismissed'

        self.reviewed_at = timezone.now()
        # record when it was reviewed

        if notes:
            self.admin_notes = notes
            # optionally save admin notes

        self.save()
        # save all changes to the database


class PasswordResetToken(models.Model):
    """Token for password reset — when a student clicks 'Forgot Password',
    we generate a UUID token, email it to them, and they use it to set a new password."""

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='reset_tokens')
    # which student requested the reset

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    # uuid.uuid4 generates a random unique ID like "a8098c1a-f86e-11da-bd1a-00112444be1e"
    # unique=True means no duplicate tokens in the database
    # editable=False means it can not be changed after creation

    created_at = models.DateTimeField(auto_now_add=True)
    # when the token was generated — used to check if it has expired (1 hour limit)

    used = models.BooleanField(default=False)
    # set to True after the student successfully resets their password
    # prevents the same token from being used twice

    class Meta:
        db_table = 'password_reset_tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reset token for {self.student.email}"
    
    def is_expired(self):
        """Token expires after 1 hour"""
        return (timezone.now() - self.created_at).total_seconds() > 3600
