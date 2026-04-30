from django.contrib import admin
from .models import User, Permission, RolePermission

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'role', 'is_staff', 'two_factor_enabled')
    list_filter = ('role', 'two_factor_enabled')

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'get_permission_code')
    list_filter = ('role',)

    def get_permission_code(self, obj):
        return obj.permission.code