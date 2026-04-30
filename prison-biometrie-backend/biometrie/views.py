from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsAdmin, IsDirecteur, IsAgent
from .models import EmpreinteDigitale, ReconnaissanceFaciale
from .serializers import EmpreinteSerializer, FaceSerializer


# =========================
# EMPREINTES DIGITALES
# =========================
class EmpreinteViewSet(ModelViewSet):
    queryset = EmpreinteDigitale.objects.select_related(
        "detenu", "detenu__prison"
    )
    serializer_class = EmpreinteSerializer

    def get_permissions(self):
        # Création = scan biométrique
        if self.action == "create":
            permission_classes = [IsAgent | IsDirecteur | IsAdmin]

        # Modification
        elif self.action in ["update", "partial_update"]:
            permission_classes = [IsDirecteur | IsAdmin]

        # Suppression
        elif self.action == "destroy":
            permission_classes = [IsAdmin]

        # Lecture
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]


# =========================
# RECONNAISSANCE FACIALE
# =========================
class FaceViewSet(ModelViewSet):
    queryset = ReconnaissanceFaciale.objects.select_related(
        "detenu", "detenu__prison"
    )
    serializer_class = FaceSerializer

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAgent | IsDirecteur | IsAdmin]

        elif self.action in ["update", "partial_update"]:
            permission_classes = [IsDirecteur | IsAdmin]

        elif self.action == "destroy":
            permission_classes = [IsAdmin]

        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]
