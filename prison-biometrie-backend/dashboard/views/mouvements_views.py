# dashboard/views/mouvements_views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from dashboard.services.websocket_service import notify_dashboard
from users.permissions import HasDynamicPermission


class MouvementCreateAPIView(APIView):
    permission_classes = [HasDynamicPermission]

    def get_permissions(self):
        # 🔐 permission liée à la création de mouvement
        self.permission_code = "add_mouvement_entrer_sortie"
        return [HasDynamicPermission()]

    def post(self, request):
        mouvement = {
            "detenu_id": request.data.get("detenu_id"),
            "action": request.data.get("action"),
            "timestamp": "2026-03-21T15:00:00"
        }

        # 🔔 Notification live
        notify_dashboard({
            "type": "NEW_MOUVEMENT",
            "message": f"Un détenu vient de {mouvement['action']}",
            "detenu_id": mouvement["detenu_id"],
            "timestamp": mouvement["timestamp"]
        })

        return Response({"success": True, "mouvement": mouvement})