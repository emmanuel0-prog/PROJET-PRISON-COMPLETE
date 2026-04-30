# dashboard/views/ia_avance_views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from dashboard.services.ia_avance_service import IAAvanceService
from users.permissions import HasDynamicPermission


class DashboardIAAvanceAPIView(APIView):
    """
    Dashboard IA avancé (REST)
    """
    permission_classes = [HasDynamicPermission]

    def get_permissions(self):
        self.permission_code = "view_dashboard_ia_avance"
        return [HasDynamicPermission()]

    def get(self, request):
        data = IAAvanceService.get_dashboard_avance()
        return Response(data)