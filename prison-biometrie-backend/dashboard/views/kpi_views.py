from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from ..services.stats_service import DashboardService
from ..services.intelligence_service import IntelligenceService, PredictionService

from core.models import DocumentEcrou
from users.permissions import HasDynamicPermission


# =========================================================
# 📊 DASHBOARD GLOBAL
# =========================================================
class DashboardAPIView(APIView):
    permission_classes = [HasDynamicPermission]

    def get_permissions(self):
        self.permission_code = "dashboard_view"
        return [HasDynamicPermission()]

    def get(self, request):
        data = DashboardService.get_dashboard()
        return Response(data)


# =========================================================
# 🧠 DASHBOARD INTELLIGENCE
# =========================================================
class IntelligenceDashboardView(APIView):
    permission_classes = [HasDynamicPermission]

    def get_permissions(self):
        self.permission_code = "dashboard_intelligence_view"
        return [HasDynamicPermission()]

    def get(self, request):
        data = IntelligenceService.get_dashboard()
        return Response(data)


# =========================================================
# ⚖️ ALERTES JURIDIQUES
# =========================================================
class AlertesJuridiquesView(APIView):
    permission_classes = [HasDynamicPermission]

    def get_permissions(self):
        self.permission_code = "view_alertes_juridiques"
        return [HasDynamicPermission()]

    def get(self, request):
        now = timezone.now()
        limite = now + timedelta(hours=48)

        alertes = DocumentEcrou.objects.filter(
            type_document='ODP',
            date_expiration__lte=limite
        ).count()

        return Response({
            "alertes_odp_48h": alertes,
            "status": "CRITIQUE" if alertes > 0 else "OK"
        })


# =========================================================
# 🤖 IA / PREDICTIONS
# =========================================================
class PredictionAPIView(APIView):
    permission_classes = [HasDynamicPermission]

    def get_permissions(self):
        self.permission_code = "view_predictions"
        return [HasDynamicPermission()]

    def get(self, request):
        prediction_pop = PredictionService.predict_population()
        prediction_affluence = PredictionService.predict_affluence()

        return Response({
            "prediction_population_7j": prediction_pop,
            "analyse_visiteurs": prediction_affluence
        })