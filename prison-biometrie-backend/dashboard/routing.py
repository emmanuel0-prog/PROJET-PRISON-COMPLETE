from django.urls import path
from .consumers import DashboardConsumer
from django.urls import re_path
from .consumers import DashboardIAAvanceConsumer

websocket_urlpatterns = [
    path("ws/dashboard/", DashboardConsumer.as_asgi()),
    re_path(r'ws/dashboard-ia/$', DashboardIAAvanceConsumer.as_asgi()),
]