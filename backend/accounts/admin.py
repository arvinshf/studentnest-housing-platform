from django.contrib import admin
# admin module lets us register models so they show up in the Django admin panel at /admin/

from django.utils.html import format_html
# format_html safely injects HTML into the admin — used for colored badges and links

from django.utils import timezone
# timezone.now() gives the current UTC time — used to check if a student is truly active

from .models import Student, Room, Message, Report
# import the models we want to manage through the admin panel


# ============================================================
# STUDENT ADMIN — how the Student model appears in /admin/
# ============================================================
@admin.register(Student)
# this decorator registers the Student model with this custom admin class
# without it, the model would not appear in the admin panel
class StudentAdmin(admin.ModelAdmin):

    list_display = ['name', 'email', 'student_id', 'online_status', 'last_login', 'last_activity', 'created_at']
    # these columns show up on the student list page in admin
    # 'online_status' is a custom method defined below (not a model field)

    search_fields = ['name', 'email', 'student_id']
    # adds a search bar that searches across these fields

    list_filter = ['is_online', 'last_login', 'created_at', 'course']
    # adds filter dropdowns on the right sidebar

    readonly_fields = ['created_at', 'updated_at', 'password_hash', 'is_online', 'last_login', 'last_activity']
    # these fields are shown but cannot be edited through the admin form

    fieldsets = (
        # fieldsets control the layout of the edit form — groups fields under headings
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
            # trailing comma is needed because it is a single-element tuple
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
            # 'collapse' makes this section collapsed by default to save space
        }),
    )

    def online_status(self, obj):
        """Display a colored dot showing online / idle / offline in the list view"""
        if obj.is_online:
            if obj.last_activity and (timezone.now() - obj.last_activity).seconds < 300:
                # if they had activity in the last 5 minutes, they are truly online
                return format_html(
                    '<span style="color: #2ecc71; font-weight: bold;">{} Online</span>',
                    '●'
                    # green dot
                )
            else:
                # they are marked online but have been inactive for over 5 minutes
                return format_html(
                    '<span style="color: #f39c12; font-weight: bold;">{} Idle</span>',
                    '●'
                    # orange dot
                )
        return format_html(
            '<span style="color: #95a5a6;">{} Offline</span>',
            '○'
            # grey hollow circle
        )
    online_status.short_description = 'Status'
    # this sets the column header text in the admin list view


# ============================================================
# ROOM ADMIN — how Room listings appear in /admin/
# ============================================================
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):

    list_display = ['title', 'owner', 'location', 'price', 'room_type', 'available_from', 'is_active', 'is_featured', 'created_at']
    # columns shown on the room list page

    search_fields = ['title', 'location', 'owner__name', 'owner__email']
    # owner__name follows the ForeignKey to Student and searches the name field

    list_filter = ['is_active', 'is_featured', 'is_verified', 'room_type', 'furnished', 'bills', 'created_at']
    # sidebar filters

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


# ============================================================
# MESSAGE ADMIN — how Messages appear in /admin/
# ============================================================
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):

    list_display = ['id', 'sender', 'recipient', 'room', 'subject', 'read_status', 'created_at']
    # 'read_status' is a custom method that shows a colored badge

    search_fields = ['subject', 'content', 'sender__name', 'recipient__name']

    list_filter = ['is_read', 'created_at']

    readonly_fields = ['sender', 'recipient', 'room', 'created_at', 'updated_at', 'read_at']
    # messages should not be editable — they are a record of what was sent

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
        """Show a green checkmark for read messages or red X for unread"""
        if obj.is_read:
            return format_html(
                '<span style="color: {}; font-weight: bold;">✓ Read</span>',
                '#2ecc71'
                # green
            )
        return format_html(
            '<span style="color: {}; font-weight: bold;">✗ Unread</span>',
            '#e74c3c'
            # red
        )
    read_status.short_description = 'Status'


# ============================================================
# REPORT ADMIN — how Reports appear in /admin/
# ============================================================
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):

    list_display = ['id', 'report_type_badge', 'room_link', 'reporter_link', 'status_badge', 'created_at']
    # all custom methods — each renders colored HTML badges or clickable links

    list_filter = ['status', 'report_type', 'created_at']
    search_fields = ['room__title', 'reporter__name', 'reporter__email', 'description']
    readonly_fields = ['created_at', 'updated_at']

    date_hierarchy = 'created_at'
    # adds a date drill-down navigation bar at the top (Year > Month > Day)

    ordering = ['-created_at']
    # newest reports first

    actions = ['mark_under_review', 'mark_resolved', 'mark_dismissed']
    # bulk actions — select multiple reports and apply an action from the dropdown

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
        """Show the report type as a colored pill badge"""
        colors = {
            'scam': '#dc3545',           # red — serious
            'incorrect': '#ffc107',       # yellow — moderate
            'inappropriate': '#dc3545',   # red
            'duplicate': '#17a2b8',       # blue — informational
            'unavailable': '#6c757d',     # grey — low priority
            'discrimination': '#dc3545',  # red
            'safety': '#dc3545',          # red
            'other': '#6c757d',           # grey
        }
        color = colors.get(obj.report_type, '#6c757d')
        # .get() returns the default grey if the type is not in the dict
        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_report_type_display()
            # get_report_type_display() turns 'scam' into 'Scam/Fraudulent Listing'
        )
    report_type_badge.short_description = 'Type'

    def status_badge(self, obj):
        """Show the review status as a colored pill badge"""
        colors = {
            'pending': '#ffc107',      # yellow
            'under_review': '#17a2b8', # blue
            'resolved': '#28a745',     # green
            'dismissed': '#6c757d',    # grey
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def room_link(self, obj):
        """Make the room title a clickable link to the Room edit page in admin"""
        return format_html(
            '<a href="/admin/accounts/room/{}/change/">{}</a>',
            obj.room.id, obj.room.title[:50]
            # [:50] truncates long titles so the table stays readable
        )
    room_link.short_description = 'Room'

    def reporter_link(self, obj):
        """Make the reporter name a clickable link to their Student edit page"""
        return format_html(
            '<a href="/admin/accounts/student/{}/change/">{}</a>',
            obj.reporter.id, obj.reporter.name
        )
    reporter_link.short_description = 'Reporter'

    # --- Bulk Actions ---
    # these appear in the "Action" dropdown when you select reports with checkboxes

    def mark_under_review(self, request, queryset):
        """Bulk action: mark selected reports as under review"""
        updated = 0
        for report in queryset:
            report.mark_reviewed('under_review', 'Marked as under review by admin')
            # calls the mark_reviewed method on the Report model
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as under review.')
        # shows a green success banner at the top of the admin page
    mark_under_review.short_description = '🔍 Mark as Under Review'

    def mark_resolved(self, request, queryset):
        """Bulk action: mark selected reports as resolved"""
        updated = 0
        for report in queryset:
            report.mark_reviewed('resolved', 'Report resolved by admin')
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as resolved.')
    mark_resolved.short_description = '✅ Mark as Resolved'

    def mark_dismissed(self, request, queryset):
        """Bulk action: mark selected reports as dismissed"""
        updated = 0
        for report in queryset:
            report.mark_reviewed('dismissed', 'Report dismissed by admin')
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as dismissed.')
    mark_dismissed.short_description = '❌ Mark as Dismissed'
