from django.contrib import admin  # gives access to the Django admin site
from django.utils.html import format_html  # safely renders HTML strings inside the admin panel
from django.utils import timezone  # used to compare datetimes in an aware, timezone-safe way
from .models import Student, Room, Message, Report  # the four models managed through this admin


@admin.register(Student)  # register the Student model so it appears in the admin panel
class StudentAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'student_id', 'online_status', 'last_login', 'last_activity', 'created_at']  # columns shown in the student list view
    search_fields = ['name', 'email', 'student_id']  # fields the admin search bar will query
    list_filter = ['is_online', 'last_login', 'created_at', 'course']  # sidebar filter options
    readonly_fields = ['created_at', 'updated_at', 'password_hash', 'is_online', 'last_login', 'last_activity']  # fields that can be viewed but not edited through the admin
    
    fieldsets = (  # organises the student detail page into named sections
        ('Personal Information', {
            'fields': ('name', 'email', 'phone', 'city')  # contact and location details
        }),
        ('Academic Information', {
            'fields': ('student_id', 'course')  # university-specific identifiers
        }),
        ('Online Status', {
            'fields': ('is_online', 'last_login', 'last_activity')  # presence tracking fields
        }),
        ('Security', {
            'fields': ('password_hash',),  # shown read-only so admins can confirm a hash exists
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)  # collapsed by default to keep the page tidy
        }),
    )
    
    def online_status(self, obj):
        # renders a coloured presence badge in the student list — green, amber, or grey
        if obj.is_online:  # the flag was set to True when the student last made a request
            # treat the student as truly active only if they were seen in the last 5 minutes
            if obj.last_activity and (timezone.now() - obj.last_activity).seconds < 300:
                return format_html(  # green dot — actively browsing right now
                    '<span style="color: #2ecc71; font-weight: bold;">{} Online</span>',
                    '●'
                )
            else:
                return format_html(  # amber dot — logged in but went quiet
                    '<span style="color: #f39c12; font-weight: bold;">{} Idle</span>',
                    '●'
                )
        return format_html(  # grey circle — not currently logged in
            '<span style="color: #95a5a6;">{} Offline</span>',
            '○'
        )
    online_status.short_description = 'Status'  # sets the column header text in the list view


@admin.register(Room)  # register the Room model so admins can browse and edit listings
class RoomAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'location', 'price', 'room_type', 'available_from', 'is_active', 'is_featured', 'created_at']  # columns shown in the room list view
    search_fields = ['title', 'location', 'owner__name', 'owner__email']  # searchable by title, location, or the landlord's details
    list_filter = ['is_active', 'is_featured', 'is_verified', 'room_type', 'furnished', 'bills', 'created_at']  # sidebar filters for quick narrowing
    readonly_fields = ['created_at', 'updated_at']  # auto-managed timestamps — no manual editing needed
    
    fieldsets = (  # groups the room detail page into logical sections
        ('Owner', {
            'fields': ('owner',)  # which student posted this listing
        }),
        ('Basic Information', {
            'fields': ('title', 'description', 'location', 'postcode', 'distance_to_transport')  # the headline details a student sees first
        }),
        ('Pricing', {
            'fields': ('price', 'deposit', 'bills')  # financial terms of the tenancy
        }),
        ('Room Details', {
            'fields': ('room_type', 'furnished', 'available_from', 'min_stay_months', 'max_stay_months')  # physical and tenancy characteristics
        }),
        ('Images', {
            'fields': ('image_1', 'image_2', 'image_3', 'image_4', 'image_5')  # up to five uploaded room photos
        }),
        ('Amenities', {
            'fields': ('wifi', 'washing_machine', 'dishwasher', 'parking', 'garden',
                      'gym', 'central_heating', 'double_glazing', 'security_system', 'bike_storage')  # boolean toggles for each amenity
        }),
        ('Status', {
            'fields': ('is_active', 'is_featured', 'is_verified')  # admin-controlled visibility flags
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)  # collapsed by default to keep the page clean
        }),
    )


@admin.register(Message)  # register the Message model for admin inspection
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'recipient', 'room', 'subject', 'read_status', 'created_at']  # key columns in the message list view
    search_fields = ['subject', 'content', 'sender__name', 'recipient__name']  # lets admins search by message text or participant name
    list_filter = ['is_read', 'created_at']  # quickly filter by unread or date sent
    readonly_fields = ['sender', 'recipient', 'room', 'created_at', 'updated_at', 'read_at']  # message history should not be editable by admins
    
    fieldsets = (  # organises the message detail page into sections
        ('Message Details', {
            'fields': ('sender', 'recipient', 'room', 'subject', 'content')  # who sent it, to whom, about which room, and what it said
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')  # whether the recipient has opened the message
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)  # hidden by default to reduce visual clutter
        }),
    )
    
    def read_status(self, obj):
        # renders a green tick or red cross in the message list to show whether it has been read
        if obj.is_read:  # recipient has already opened the message
            return format_html(  # green tick
                '<span style="color: {}; font-weight: bold;">✓ Read</span>',
                '#2ecc71'
            )
        return format_html(  # red cross — still waiting to be opened
            '<span style="color: {}; font-weight: bold;">✗ Unread</span>',
            '#e74c3c'
        )
    read_status.short_description = 'Status'  # column header in the list view


@admin.register(Report)  # register the Report model so admins can triage flagged listings
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'report_type_badge', 'room_link', 'reporter_link', 'status_badge', 'created_at']  # columns shown in the report list view
    list_filter = ['status', 'report_type', 'created_at']  # filter by resolution state, category, or date
    search_fields = ['room__title', 'reporter__name', 'reporter__email', 'description']  # search by room name, reporter name/email, or report text
    readonly_fields = ['created_at', 'updated_at']  # timestamps are set automatically
    date_hierarchy = 'created_at'  # adds a date drilldown bar at the top of the list
    ordering = ['-created_at']  # newest reports appear first so urgent ones aren't buried
    actions = ['mark_under_review', 'mark_resolved', 'mark_dismissed']  # bulk actions available from the list view
    
    fieldsets = (  # organises the report detail page into sections
        ('Report Information', {
            'fields': ('reporter', 'room', 'report_type', 'description')  # who filed it, about which room, the category, and their written explanation
        }),
        ('Status', {
            'fields': ('status', 'reviewed_at', 'admin_notes')  # current resolution state and any internal admin notes
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)  # hidden by default to keep the form compact
        }),
    )
    
    def report_type_badge(self, obj):
        # renders the report category as a coloured pill badge for quick visual scanning
        colors = {  # severity-based colour mapping: red = serious, amber = factual, blue/grey = informational
            'scam': '#dc3545',           # red — potential fraud
            'incorrect': '#ffc107',      # amber — wrong information rather than malicious intent
            'inappropriate': '#dc3545',  # red — offensive content
            'duplicate': '#17a2b8',      # blue — listing already exists elsewhere
            'unavailable': '#6c757d',    # grey — room is no longer available
            'discrimination': '#dc3545', # red — illegal discriminatory language
            'safety': '#dc3545',         # red — safety concern
            'other': '#6c757d',          # grey — doesn't fit the above categories
        }
        color = colors.get(obj.report_type, '#6c757d')  # fall back to grey if the type is unrecognised
        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_report_type_display()  # use the human-readable label from the model choices
        )
    report_type_badge.short_description = 'Type'  # column header in the list view
    
    def status_badge(self, obj):
        # renders the current resolution state as a coloured pill badge
        colors = {  # colour coding mirrors traffic light logic
            'pending': '#ffc107',       # amber — not yet looked at
            'under_review': '#17a2b8',  # blue — an admin is actively investigating
            'resolved': '#28a745',      # green — action was taken
            'dismissed': '#6c757d',     # grey — no action needed
        }
        color = colors.get(obj.status, '#6c757d')  # fall back to grey for unknown states
        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()  # use the human-readable label from the model choices
        )
    status_badge.short_description = 'Status'  # column header in the list view
    
    def room_link(self, obj):
        # renders the reported room's title as a clickable link to its admin edit page
        return format_html(
            '<a href="/admin/accounts/room/{}/change/">{}</a>',
            obj.room.id, obj.room.title[:50]  # truncate long titles so the column stays narrow
        )
    room_link.short_description = 'Room'  # column header in the list view
    
    def reporter_link(self, obj):
        # renders the reporter's name as a clickable link to their student admin page
        return format_html(
            '<a href="/admin/accounts/student/{}/change/">{}</a>',
            obj.reporter.id, obj.reporter.name
        )
    reporter_link.short_description = 'Reporter'  # column header in the list view
    
    # bulk actions available in the report list view — lets admins process multiple reports at once
    def mark_under_review(self, request, queryset):
        # signals that an admin is actively looking into the selected reports
        updated = 0
        for report in queryset:  # loop through every selected report
            report.mark_reviewed('under_review', 'Marked as under review by admin')  # calls the model method which sets status + timestamp
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as under review.')  # show a success message in the admin UI
    mark_under_review.short_description = '🔍 Mark as Under Review'  # label shown in the Actions dropdown
    
    def mark_resolved(self, request, queryset):
        # marks the selected reports as dealt with — action was taken on the listing
        updated = 0
        for report in queryset:
            report.mark_reviewed('resolved', 'Report resolved by admin')
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as resolved.')
    mark_resolved.short_description = '✅ Mark as Resolved'  # label shown in the Actions dropdown
    
    def mark_dismissed(self, request, queryset):
        # marks the selected reports as invalid or not actionable — no changes will be made
        updated = 0
        for report in queryset:
            report.mark_reviewed('dismissed', 'Report dismissed by admin')
            updated += 1
        self.message_user(request, f'{updated} report(s) marked as dismissed.')
    mark_dismissed.short_description = '❌ Mark as Dismissed'  # label shown in the Actions dropdown
