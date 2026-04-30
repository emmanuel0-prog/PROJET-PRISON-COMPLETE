from rest_framework import serializers
from .models import EmpreinteDigitale, ReconnaissanceFaciale


class EmpreinteSerializer(serializers.ModelSerializer):
    detenu_nom = serializers.CharField(source="detenu.nom", read_only=True)
    prison = serializers.CharField(source="detenu.prison.nom", read_only=True)

    class Meta:
        model = EmpreinteDigitale
        fields = "__all__"
        read_only_fields = ["date_enregistrement"]


class FaceSerializer(serializers.ModelSerializer):
    detenu_nom = serializers.CharField(source="detenu.nom", read_only=True)
    prison = serializers.CharField(source="detenu.prison.nom", read_only=True)

    class Meta:
        model = ReconnaissanceFaciale
        fields = "__all__"
        read_only_fields = ["date_enregistrement"]
