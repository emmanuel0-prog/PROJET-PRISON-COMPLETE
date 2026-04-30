from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from core.models import Visiteur, Detenu

class IntelligenceService:
    """
    Service d'analyse intelligente pour le Cabinet du Ministre.
    Gère la détection des risques visiteurs et les alertes critiques.
    """

    @staticmethod
    def get_alertes():
        """
        Génère une liste d'alertes en temps réel (24h)
        """
        last_24h = timezone.now() - timedelta(hours=24)
        alertes = []

        # Analyse des flux de visiteurs suspects
        visiteurs = Visiteur.objects.filter(heure_entree__gte=last_24h)
        for v in visiteurs:
            nb_visites = Visiteur.objects.filter(
                nom_complet=v.nom_complet,
                heure_entree__gte=last_24h
            ).count()

            if getattr(v, 'alerte_securite', False):
                alertes.append({
                    "type": "CRITIQUE",
                    "message": f"⚠️ Visiteur suspect détecté : {v.nom_complet}"
                })
            elif nb_visites >= 3:
                alertes.append({
                    "type": "SURVEILLANCE",
                    "message": f"🔁 Visites répétées : {v.nom_complet} ({nb_visites} fois)"
                })

        # Analyse de la dangerosité
        dangereux = Detenu.objects.filter(est_dangereux=True).count()
        if dangereux > 0:
            alertes.append({
                "type": "INFO",
                "message": f"🚨 {dangereux} détenus à haute sécurité sous surveillance"
            })

        # Alerte de capacité
        total = Detenu.objects.filter(est_supprime=False).count()
        if total > 200: # Seuil à adapter selon la prison
            alertes.append({
                "type": "ALERTE",
                "message": f"🏚️ Seuil de surpopulation atteint : {total} détenus"
            })

        return alertes

    @staticmethod
    def score_visiteur(nom):
        """
        Calcule un score de risque de 0 à 100 pour un visiteur spécifique
        """
        last_30_days = timezone.now() - timedelta(days=30)
        visites = Visiteur.objects.filter(
            nom_complet=nom,
            heure_entree__gte=last_30_days
        ).count()

        score = 0
        if visites >= 5: score += 50
        elif visites >= 3: score += 30

        suspect = Visiteur.objects.filter(
            nom_complet=nom,
            alerte_securite=True
        ).exists()

        if suspect: score += 50
        return min(score, 100)

    @staticmethod
    def get_top_cibles():
        """
        Identifie les détenus recevant le plus de visites (indicateur de risque)
        """
        last_30_days = timezone.now() - timedelta(days=30)
        data = Visiteur.objects.filter(
            heure_entree__gte=last_30_days
        ).values(
            'detenu_visite__nom',
            'detenu_visite__postnom'
        ).annotate(
            total=Count('id')
        ).order_by('-total')[:5]

        return [
            {
                "detenu": f"{d['detenu_visite__nom']} {d['detenu_visite__postnom']}",
                "visites": d['total'],
                "risque": "CRITIQUE" if d['total'] >= 5 else "MODERE"
            }
            for d in data
        ]

    @staticmethod
    def get_dashboard():
        """Point d'entrée pour l'API Intelligence"""
        return {
            "alertes": IntelligenceService.get_alertes(),
            "top_cibles": IntelligenceService.get_top_cibles(),
        }


class PredictionService:
    """
    Moteur de prédiction IA simple pour l'affluence et la population.
    """

    @staticmethod
    def predict_affluence():
        """
        Analyse les 7 derniers jours pour prédire les visites de demain
        """
        today = timezone.now().date()
        historique = []

        for i in range(7):
            day = today - timedelta(days=i)
            count = Visiteur.objects.filter(heure_entree__date=day).count()
            historique.append({
                "date": day.strftime("%d/%m"),
                "visites": count
            })

        moyenne = sum(d["visites"] for d in historique) / 7 if historique else 0
        
        # Calcul de tendance
        tendance = "STABLE"
        if len(historique) >= 2:
            # On compare aujourd'hui par rapport au début de semaine
            if historique[0]["visites"] > historique[-1]["visites"]:
                tendance = "HAUSSE"
            elif historique[0]["visites"] < historique[-1]["visites"]:
                tendance = "BAISSE"

        return {
            "historique": historique[::-1], # Inverser pour l'ordre chronologique
            "prediction_prochain_jour": round(moyenne),
            "tendance": tendance
        }

    @staticmethod
    def predict_population():
        """
        Prédit la population carcérale à J+7
        """
        today = timezone.now().date()
        
        # Moyenne des entrées sur les 7 derniers jours
        stats_entrees = Detenu.objects.filter(
            date_entree__gte=today - timedelta(days=7),
            est_supprime=False
        ).count()
        
        moyenne_entree_jour = stats_entrees / 7
        population_actuelle = Detenu.objects.filter(est_supprime=False).count()
        
        # Projection à 7 jours
        return round(population_actuelle + (moyenne_entree_jour * 7))