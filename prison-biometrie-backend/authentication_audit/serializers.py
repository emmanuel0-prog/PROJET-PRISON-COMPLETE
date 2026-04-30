from rest_framework import serializers
from .models import AuthAuditLog

class AuthAuditLogSerializer(serializers.ModelSerializer):
    # Affichage du label complet au lieu du code (ex: "Connexion réussie" au lieu de "LOGIN_SUCCESS")
    event_display = serializers.CharField(source='get_event_type_display', read_only=True)
    risk_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    
    # Formatage de l'heure pour le tableau de bord
    date_heure = serializers.DateTimeField(source='timestamp', format="%d/%m/%Y %H:%M:%S", read_only=True)
    
    # Information sur l'utilisateur lié
    agent_name = serializers.CharField(source='user.username', read_only=True, default="N/A")

    class Meta:
        model = AuthAuditLog
        fields = [
            'id', 'user', 'agent_name', 'username_attempt', 'event_type', 
            'event_display', 'ip_address', 'user_agent', 'country', 
            'city', 'risk_level', 'risk_display', 'success', 'timestamp', 'date_heure'
        ]