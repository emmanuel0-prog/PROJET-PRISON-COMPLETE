from django.urls import re_path
from dashboard.consumers import DashboardConsumer
from . import consumers
from django.urls import path

websocket_urlpatterns = [
    # .as_asgi() est la méthode correcte pour les consumers
    re_path(r'ws/security/$', consumers.SecurityAlertConsumer.as_asgi()),
    path("ws/dashboard/", DashboardConsumer.as_asgi()),
    re_path(r'ws/dashboard/$', consumers.DashboardConsumer.as_asgi()),
    
]