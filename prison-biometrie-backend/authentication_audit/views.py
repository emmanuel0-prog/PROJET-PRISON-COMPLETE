from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuthAuditLog
from .serializers import AuthAuditLogSerializer

class AuthAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    CONTRÔLE D'ACCÈS RÉPUBLICAIN
    Analyse des tentatives de connexion et détection de risques.
    """
    queryset = AuthAuditLog.objects.all()
    serializer_class = AuthAuditLogSerializer
    permission_classes = [IsAdminUser] # Seule la haute hiérarchie accède aux logs
    
    # Filtres pour l'investigation numérique
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # On permet de filtrer par niveau de risque ou par type d'événement
    filterset_fields = ['risk_level', 'event_type', 'success', 'country']
    
    # Recherche par IP ou par nom d'utilisateur tenté
    search_fields = ['ip_address', 'username_attempt', 'city']
    
    # Toujours les plus récents en premier
    ordering = ['-timestamp']