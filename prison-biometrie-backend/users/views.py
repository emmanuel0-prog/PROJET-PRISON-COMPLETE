import logging

from django.contrib.auth import authenticate, get_user_model
from django.utils.timezone import now

from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from authentication_audit.models import AuthAuditLog

from .models import (
    User,
    Permission,
    RolePermission
)
# =========================================================
# 🔐 LOGIN VIEW (PRODUCTION SECURE)
# =========================================================
import pyotp
import logging

from django.conf import settings
from django.utils.timezone import now
from django.contrib.auth import authenticate


from .serializers import (
    UserSerializer,
    PermissionSerializer,
    RolePermissionSerializer
)

from .permissions import HasDynamicPermission

from .security import (
    is_ip_blocked,
    register_failed_attempt,
    reset_attempts
)

from .utils import get_ip_info


logger = logging.getLogger(__name__)

User = get_user_model()
logger = logging.getLogger(__name__)




class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # On combine l'authentification standard + notre système dynamique
    permission_classes = [IsAuthenticated, HasDynamicPermission]
    
    # C'est ici que tu définis le code requis pour cette vue
    permission_code = 'manage_users'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role')
    
    if User.objects.filter(username=username).exists():
        return Response({"error": "Utilisateur existe déjà"}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, email=email, password=password, role=role)
    return Response({"message": "Utilisateur créé avec succès"}, status=status.HTTP_201_CREATED)

# =========================================================
# 🔐 LOGIN AVEC 2FA + PERMISSIONS
# =========================================================





logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):

    username = (request.data.get("username") or "").strip()
    password = (request.data.get("password") or "").strip()

    ip = request.META.get("REMOTE_ADDR", "0.0.0.0")
    user_agent = request.META.get("HTTP_USER_AGENT", "unknown")

    # 🔥 SAFE GEO (IMPORTANT - évite 500)
    try:
        geo = get_ip_info(ip)
        if not isinstance(geo, dict):
            geo = {"country": "Unknown", "city": "Unknown"}
    except Exception:
        geo = {"country": "Unknown", "city": "Unknown"}

    # 🚫 IP bloquée
    if is_ip_blocked(ip):

        AuthAuditLog.objects.create(
            username_attempt=username,
            event_type="ACCOUNT_LOCKED",
            ip_address=ip,
            user_agent=user_agent,
            country=geo["country"],
            city=geo["city"],
            success=False
        )

        return Response(
            {"error": "IP bloquée"},
            status=status.HTTP_403_FORBIDDEN
        )

    # 🔐 Auth
    user = authenticate(username=username, password=password)

    if not user:

        register_failed_attempt(ip)

        AuthAuditLog.objects.create(
            username_attempt=username,
            event_type="LOGIN_FAILED",
            ip_address=ip,
            user_agent=user_agent,
            country=geo["country"],
            city=geo["city"],
            success=False
        )

        return Response(
            {"error": "Identifiants invalides"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # reset attempts
    reset_attempts(ip)

    if not user.is_active:
        return Response(
            {"error": "Compte désactivé"},
            status=status.HTTP_403_FORBIDDEN
        )

    # 🌍 Login suspect
    if user.last_login_ip and user.last_login_ip != ip:

        AuthAuditLog.objects.create(
            user=user,
            event_type="SUSPICIOUS_LOGIN",
            ip_address=ip,
            user_agent=user_agent,
            country=geo["country"],
            city=geo["city"],
            success=True
        )

    # 🎫 JWT
    refresh = RefreshToken.for_user(user)

    user.last_login_ip = ip
    user.last_login = now()
    user.save(update_fields=["last_login_ip", "last_login"])

    # log success
    AuthAuditLog.objects.create(
        user=user,
        event_type="LOGIN_SUCCESS",
        ip_address=ip,
        user_agent=user_agent,
        country=geo["country"],
        city=geo["city"],
        success=True
    )

    # permissions
    permissions = list(
        RolePermission.objects.filter(role=user.role)
        .values_list('permission__code', flat=True)
    )

    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "permissions": permissions
        }
    })


# =========================================================
# 🔐 VERIFY 2FA
# (tu peux garder ou supprimer si inutile)
# =========================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa(request):

    user = request.user
    code = request.data.get("otp")

    if not user.otp_secret:
        return Response({"error": "2FA non initialisé"}, status=400)

    totp = pyotp.TOTP(user.otp_secret)

    if totp.verify(code):

        user.two_factor_enabled = True
        user.save()

        return Response({"message": "2FA activé avec succès"})

    return Response({"error": "Code invalide"}, status=400)


# =========================================================
# 📍 LOGIN MAP
# =========================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def login_map(request):

    logs = AuthAuditLog.objects.filter(success=True).values(
        "ip_address",
        "country",
        "city",
        "created_at"
    )

    return Response(list(logs))

# =========================================================
# 🔐 TEST AUTH
# =========================================================
class TestAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        permissions = list(
            RolePermission.objects.filter(role=request.user.role)
            .values_list('permission__code', flat=True)
        )

        return Response({
            "message": "Authentification réussie",
            "user": request.user.username,
            "role": request.user.role,
            "permissions": permissions
        })


# =========================================================
# 🔹 1. TOUTES LES PERMISSIONS
# =========================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_permissions(request):
    perms = Permission.objects.all().order_by('category', 'name')
    serializer = PermissionSerializer(perms, many=True)
    return Response(serializer.data)


# =========================================================
# 🔹 2. PERMISSIONS PAR RÔLE
# =========================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_role_permissions(request, role):
    role_perms = RolePermission.objects.filter(role=role)
    serializer = RolePermissionSerializer(role_perms, many=True)
    return Response(serializer.data)


# =========================================================
# 🔹 3. AJOUT PERMISSION
# =========================================================

class AssignPermissionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.data.get("role")
        permission_code = request.data.get("permission_code")

        if not role or not permission_code:
            return Response(
                {"error": "role et permission_code requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            permission = Permission.objects.get(code=permission_code)
            obj, created = RolePermission.objects.get_or_create(
                role=role,
                permission=permission
            )
            return Response({
                "message": "Ajoutée" if created else "Déjà existante"
            })
        except Permission.DoesNotExist:
            return Response(
                {"error": "Permission introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

# =========================================================
# 🔹 4. SUPPRESSION PERMISSION
# =========================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_permission(request):
    role = request.data.get("role")
    permission_code = request.data.get("permission_code")

    if not role or not permission_code:
        return Response(
            {"error": "role et permission_code requis"},
            status=status.HTTP_400_BAD_REQUEST
        )

    deleted, _ = RolePermission.objects.filter(
        role=role,
        permission__code=permission_code
    ).delete()

    return Response({
        "message": "Supprimée" if deleted else "Aucune correspondance"
    })


# =========================================================
# 🔹 5. MES PERMISSIONS
# =========================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_permissions(request):
    permissions = list(
        RolePermission.objects.filter(role=request.user.role)
        .values_list('permission__code', flat=True)
    )

    return Response(permissions)


# =========================================================
# 🔹 6. PERMISSIONS PAR RÔLES (GLOBAL)
# =========================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_roles_permissions(request):
    data = {}

    roles = [choice[0] for choice in RolePermission._meta.get_field('role').choices]

    for role in roles:
        perms = RolePermission.objects.filter(role=role).values_list(
            'permission__code', flat=True
        )
        data[role] = list(perms)

    return Response(data)




# =========================================================
# 👥 LISTE DES UTILISATEURS
# =========================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    users = User.objects.all().values('id', 'username', 'email', 'role', 'is_active')
    return Response(list(users))


# =========================================================
# 👥 MODIFIER / SUPPRIMER UN UTILISATEUR
# =========================================================
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_detail(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        new_role = request.data.get('role')
        if new_role:
            user.role = new_role
            user.save(update_fields=['role'])
        return Response({"message": "Rôle mis à jour"})

    elif request.method == 'DELETE':
        user.delete()
        return Response({"message": "Utilisateur supprimé"})