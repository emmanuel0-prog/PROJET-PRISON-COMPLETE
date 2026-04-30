# dashboard/views/geographie_views.py

from core.models import Prison
from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import HasDynamicPermission


class CartePrisonsView(APIView):
    permission_classes = [HasDynamicPermission]

    def get_permissions(self):
        self.permission_code = "view_carte_prisons"
        return [HasDynamicPermission()]

    def get(self, request):
        prisons = Prison.objects.all()

        data = [{
            "nom": p.nom,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "capacite": p.capacite
        } for p in prisons]

        return Response(data)