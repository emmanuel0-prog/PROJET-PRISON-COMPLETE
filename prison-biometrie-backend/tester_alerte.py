import os
import django
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

def simuler_interception():
    print("🚀 Simulation d'une détection de suspect...")
    
    channel_layer = get_channel_layer()
    
    # Données de l'alerte
    alerte_data = {
        "type": "security_message",
        "content": {
            "type": "CRITICAL_ALERT",
            "nom": "MUKENDI Jean-Pierre",
            "motif": "Tentative d'accès - Individu sur liste noire (Watchlist)",
            "danger": "ROUGE",
            "prison": "Prison Centrale de Makala"
        }
    }
    
    # Envoi au groupe WebSocket
    async_to_sync(channel_layer.group_send)("security_alerts", alerte_data)
    print("✅ Alerte envoyée au canal de sécurité !")

if __name__ == "__main__":
    simuler_interception()