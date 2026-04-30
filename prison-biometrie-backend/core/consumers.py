import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SecurityAlertConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Action à la connexion d'un client (ex: ouverture du dashboard)"""
        # On définit un nom de groupe pour pouvoir envoyer des messages à tous les officiers connectés
        self.group_name = "security_alerts"

        # Rejoindre le groupe
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        print(f"📡 Connexion sécurisée établie : {self.channel_name}")

    async def disconnect(self, close_code):
        """Action à la déconnexion"""
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        print("🔌 Connexion sécurisée fermée")

    async def security_message(self, event):
        """
        Cette méthode est appelée quand le backend envoie un message au groupe.
        Le type 'security_message' dans group_send correspond à cette fonction.
        """
        content = event["content"]

        # Envoi effectif du message au frontend React via le WebSocket
        await self.send(text_data=json.dumps(content))
    

# core/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        # tu peux envoyer en retour le dashboard IA avancé
        from dashboard.services.ia_avance_service import IAAvanceService
        data = IAAvanceService.get_dashboard_avance()
        await self.send(text_data=json.dumps(data))