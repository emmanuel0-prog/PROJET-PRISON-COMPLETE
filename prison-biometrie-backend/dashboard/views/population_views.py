from django.db.models.functions import TruncMonth
from django.db.models import Count
from core.models import Detenu
from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import HasDynamicPermission


class EvolutionPopulationView(APIView):
    permission_classes = [HasDynamicPermission]

    # 🔐 Permission liée au seed
    permission_code = "view_population"

    def get_permissions(self):
        # 🔥 injection dynamique obligatoire
        self.permission_code = "view_population"
        return [HasDynamicPermission()]

    def get(self, request):
        data = (
            Detenu.objects
            .annotate(month=TruncMonth('date_entree'))
            .values('month')
            .annotate(total=Count('id'))
            .order_by('month')
        )

        return Response(data)