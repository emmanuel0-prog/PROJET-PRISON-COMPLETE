# Dans ton fichier urls.py (celui où tu as tes autres routes api/)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthAuditLogViewSet # Importe ta nouvelle vue

router = DefaultRouter()
# ... tes autres enregistrements ...
router.register(r'', AuthAuditLogViewSet, basename='auth-audit')

urlpatterns = [
    # ... tes autres paths ...
    path('', include(router.urls)),
]