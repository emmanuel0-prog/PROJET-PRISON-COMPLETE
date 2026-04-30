from rest_framework import serializers


# ================================
# KPI GLOBALS
# ================================
class KpiSerializer(serializers.Serializer):
    total_detenus = serializers.IntegerField()
    prevenus = serializers.IntegerField()
    condamnes = serializers.IntegerField()
    taux_biometrique = serializers.FloatField()
    taux_occupation = serializers.FloatField()


# ================================
# EVOLUTION (LINE CHART)
# ================================
class EvolutionSerializer(serializers.Serializer):
    mois = serializers.CharField()
    entrees = serializers.IntegerField()
    sorties = serializers.IntegerField()


# ================================
# MOUVEMENTS RECENTS
# ================================
class MouvementRecentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    detenu = serializers.CharField()
    type = serializers.CharField()  # ENTREE / SORTIE
    date = serializers.DateTimeField()


# ================================
# REPARTITION INFRACTIONS (BAR CHART)
# ================================
class InfractionSerializer(serializers.Serializer):
    categorie = serializers.CharField()
    total = serializers.IntegerField()


# ================================
# GEO (CARTE)
# ================================
class GeoSerializer(serializers.Serializer):
    province = serializers.CharField()
    total = serializers.IntegerField()


# ================================
# INTELLIGENCE (VISITES / RISQUE)
# ================================
class IntelligenceSerializer(serializers.Serializer):
    nom = serializers.CharField()
    detenu = serializers.CharField()
    risque = serializers.CharField()
    visites = serializers.IntegerField()


# ================================
# DASHBOARD COMPLET
# ================================
class DashboardSerializer(serializers.Serializer):
    kpis = KpiSerializer()
    evolution = EvolutionSerializer(many=True)
    mouvements = MouvementRecentSerializer(many=True)
    infractions = InfractionSerializer(many=True)
    geographie = GeoSerializer(many=True)
    intelligence = IntelligenceSerializer(many=True)