from rest_framework.views import APIView
from rest_framework.response import Response
from dashboard.services.stats_service import DashboardService
from users.permissions import HasDynamicPermission


class DashboardAPIView(APIView):
    permission_classes = [HasDynamicPermission]

    # 🔐 permission liée à ton seed
    permission_code = "view_dashboard_global"

    def get_permissions(self):
        # 🔥 injection obligatoire pour ton système dynamique
        self.permission_code = "view_dashboard_global"
        return [HasDynamicPermission()]

    def get(self, request):
        data = DashboardService.get_dashboard()
        return Response(data)