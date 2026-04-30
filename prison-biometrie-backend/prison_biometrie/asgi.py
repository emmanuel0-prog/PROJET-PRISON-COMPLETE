import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

import core.routing  # tes URLs WebSocket définies dans core/routing.py

# Définit le settings module de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')

# ProtocolTypeRouter permet de router les requêtes selon le protocole
application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # tout ce qui est HTTP normal passe ici

    "websocket": AuthMiddlewareStack(  # WebSocket avec authentification Django
        URLRouter(
            core.routing.websocket_urlpatterns  # tes URLs WS
        )
    ),
})