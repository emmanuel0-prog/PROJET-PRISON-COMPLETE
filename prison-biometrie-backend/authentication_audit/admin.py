from django.contrib import admin
from .models import AuthAuditLog


@admin.register(AuthAuditLog)
class AuthAuditLogAdmin(admin.ModelAdmin):
    list_display = ("event_type", "user", "username_attempt", "ip_address", "success", "timestamp")
    list_filter = ("event_type", "success", "timestamp")
    search_fields = ("username_attempt", "user__username", "ip_address")