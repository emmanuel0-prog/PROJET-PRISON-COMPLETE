from rest_framework import serializers
from .models import User, Permission, RolePermission


# =========================================================
# 🔹 USER SERIALIZER (AMÉLIORÉ)
# =========================================================
class UserSerializer(serializers.ModelSerializer):
    # 🔥 Ajoute permissions directement dans user (très utile React)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'telephone',
            'two_factor_enabled',
            'is_verified',
            'permissions'  # 👈 ajouté
        ]

    def get_permissions(self, obj):
        return list(
            RolePermission.objects.filter(role=obj.role)
            .values_list('permission__code', flat=True)
        )


# =========================================================
# 🔹 PERMISSION SERIALIZER
# =========================================================
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'code', 'category']  # 👈 amélioré


# =========================================================
# 🔹 ROLE PERMISSION SERIALIZER
# =========================================================
class RolePermissionSerializer(serializers.ModelSerializer):
    permission = PermissionSerializer()

    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'permission']