from rest_framework.views import APIView
from rest_framework.response import Response
from dashboard.services.intelligence_service import IntelligenceService
from users.permissions import HasDynamicPermission


class IntelligenceDashboardView(APIView):
    permission_classes = [HasDynamicPermission]

    def get(self, request):
        data = IntelligenceService.get_dashboard()
        return Response(data)