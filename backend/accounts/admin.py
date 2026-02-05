from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Student, Room, Message, Report


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'student_id', 'online_status', 'last_login', 'last_activity', 'created_at']
    search_fields = ['name', 'email', 'student_id']
    list_filter = ['is_online', 'last_login', 'created_at', 'course']
    readonly_fields = ['created_at', 'updated_at', 'password_hash', 'is_online', 'last_login', 'last_activity']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('name', 'email', 'phone', 'city')
        }),
        ('Academic Information', {
            'fields': ('student_id', 'course')
        }),
        ('Online Status', {
            'fields': ('is_online', 'last_login', 'last_activity')
        }),
        ('Security', {
            'fields': ('password_hash',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def online_status(self, obj):
        """Display online status with color indicator"""
        if obj.is_online:
            # Check if truly active (within last 5 minutes)
            if obj.last_activity and (timezone.now() - obj.last_activity).seconds < 300:
                return format_html(
                    '<span style="color: #2ecc71; font-weight: bold;">{} Online</span>',
                    '●'
                )
            else:
                # Online but inactive
                return format_html(
                    '<span style="color: #f39c12; font-weight: bold;">{} Idle</span>',
                    '●'
                )
        return format_html(
            '<span style="color: #95a5a6;">{} Offline</span>',
            '○'
        )
    online_status.short_description = 'Status'


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'location', 'price', 'room_type', 'available_from', 'is_active', 'is_featured', 'created_at']
    search_fields = ['title', 'location', 'owner__name', 'owner__email']
    list_filter = ['is_active', 'is_featured', 'is_verified', 'room_type', 'furnished', 'bills', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Owner', {
            'fields': ('owner',)
        }),
        ('Basic Information', {
            'fields': ('title', 'description', 'location', 'postcode', 'distance_to_transport')
        }),
        ('Pricing', {
            'fields': ('price', 'deposit', 'bills')
        }),
        ('Room Details', {
            'fields': ('room_type', 'furnished', 'available_from', 'min_stay_months', 'max_stay_months')
        }),
        ('Images', {
            'fields': ('image_1', 'image_2', 'image_3', 'image_4', 'image_5')
        }),
        ('Amenities', {
            'fields': ('wifi', 'washing_machine', 'dishwasher', 'parking', 'garden', 
                      'gym', 'central_heating', 'double_glazing', 'security_system', 'bike_storage')
        }),
        ('Status', {
            'fields': ('is_active', 'is_featured', 'is_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'recipient', 'room', 'subject', 'read_status', 'created_at']
    search_fields = ['subject', 'content', 'sender__name', 'recipient__name']
    list_filter = ['is_read', 'created_at']
    readonly_fields = ['sender', 'recipient', 'room', 'created_at', 'updated_at', 'read_at']
    
    fieldsets = (
        ('Message Details', {
            'fields': ('sender', 'recipient', 'room', 'subject', 'content')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def read_status(self, obj):
        """Display read status with color indicator"""
        if obj.is_read:
            return format_html(
                '<span style="color: {}; font-weight: bold;">✓ Read</span>',
                '#2ecc71'
            )
        return format_html(
            '<span style="color: {}; font-weight: bold;">✗ Unread</span>',
            '#e74c3c'
        )
    read_status.short_description = 'Status'


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'report_type_badge', 'room_link', 'reporter_link', 'status_badge', 'created_at']
    list_filter = ['status', 'report_type', 'created_at']
    search_fields = ['room__title', 'reporter__name', 'reporter__email', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    actions = ['mark_under_review', 'mark_resolved', 'mark_dismissed']
    
    fieldsets = (
        ('Report Information', {
            'fields': ('reporter', 'room', 'report_type', 'description')
        }),
        ('Status', {
            'fields': ('status', 'reviewed_at', 'admin_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def report_type_badge(self, obj):
        colors = {
            'scam': '#dc3545',
            'incorrect': '#ffc107',
            'inappropriate': '#dc3545',
            'duplicate': '#17a2b8',
            'unavailable': '#6c757d',
            'discrimination': '#dc3545',
            'safety': '#dc3545',
            'other': '#6c757d',
        }
        color = colors.get(obj.report_type, '#6c757d')
        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_report_type_display()
        )
    report_type_badge.short_description = 'Type'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#ffc107',
            'under_review': '#17a2b8',
            'resolved': '#28a745',
            'dismissed': '#6c757d',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def room_link(self, obj):
        return format_html(
            '<a href="/admin/accounts/room/{}/change/">{}</a>',
            obj.room.id, obj.room.title[:50]
        )
    room_link.short_description = 'Room'
    
    def reporter_link(self, obj):
        return format_html(
            '<a href="/admin/accounts/student/{}/change/">{}</a>',
            obj.reporter.id, obj.reporter.name
        )
    reporter_link.short_description = 'Reporter'
    
    # Admin Actions
    def mark_under_review(self, request, queryset):
        """Mark selected reports as under review"""
        updated = 0
        for report in queryset:
            report.mark_reviewed('under_review', 'Marked as under review by admin')
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as under review.')
    mark_under_review.short_description = '🔍 Mark as Under Review'
    
    def mark_resolved(self, request, queryset):
        """Mark selected reports as resolved"""
        updated = 0
        for report in queryset:
            report.mark_reviewed('resolved', 'Report resolved by admin')
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as resolved.')
    mark_resolved.short_description = '✅ Mark as Resolved'
    
    def mark_dismissed(self, request, queryset):
        """Mark selected reports as dismissed"""
        updated = 0
        for report in queryset:
            report.mark_reviewed('dismissed', 'Report dismissed by admin')
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as dismissed.')
    mark_dismissed.short_description = '❌ Mark as Dismissed'
