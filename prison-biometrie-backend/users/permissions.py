from rest_framework.permissions import BasePermission
from .models import RolePermission

class HasDynamicPermission(BasePermission):
    """
    Permission dynamique basée sur role + code
    """

    def has_permission(self, request, view):

        # SUPER ADMIN
        if request.user and request.user.is_superuser:
            return True

        # AUTH CHECK
        if not request.user or not request.user.is_authenticated:
            return False

        # Récupération dynamique
        permission_code = getattr(view, 'permission_code', None)

        if not permission_code:
            return False

        return RolePermission.objects.filter(
            role=request.user.role,
            permission__code=permission_code
        ).exists()