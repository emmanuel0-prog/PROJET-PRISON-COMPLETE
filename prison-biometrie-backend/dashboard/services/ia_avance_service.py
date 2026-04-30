# dashboard/services/ia_avance_service.py
from django.db import models
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count

from core.models import Visiteur, Detenu

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest


class IAAvanceService:

    # ================================
    # 1️⃣ SCORING INTELLIGENT VISITEURS
    # ================================
    @staticmethod
    def score_visiteurs():
        last_30_days = timezone.now() - timedelta(days=30)

        # 🔥 GROUP BY intelligent (clé unique visiteur)
        visiteurs = (
            Visiteur.objects
            .filter(heure_entree__gte=last_30_days)
            .values('telephone', 'piece_identite_numero')
            .annotate(
                nombre_visites=Count('id', distinct=True),
                alerte_count=Count('id', filter=models.Q(alerte_securite=True))
            )
        )

        df = pd.DataFrame(list(visiteurs))

        if df.empty:
            return []

        # Remplacer NaN
        df['telephone'] = df['telephone'].fillna("INCONNU")
        df['piece_identite_numero'] = df['piece_identite_numero'].fillna("INCONNU")

        # 🔥 SCORE AVANCÉ
        def compute_score(row):
            score = 0

            # Alerte sécurité
            if row['alerte_count'] > 0:
                score += 50

            # Fréquence visites
            if row['nombre_visites'] >= 5:
                score += 40
            elif row['nombre_visites'] >= 3:
                score += 25

            return min(score, 100)

        df['score'] = df.apply(compute_score, axis=1)

        return df.to_dict(orient='records')


    # ================================
    # 2️⃣ DÉTECTION FAUX NOMS 👀
    # ================================
    @staticmethod
    def detect_faux_noms():
        last_30_days = timezone.now() - timedelta(days=30)

        visiteurs = (
            Visiteur.objects
            .filter(heure_entree__gte=last_30_days)
            .values('piece_identite_numero')
            .annotate(
                noms_differents=Count('nom_complet', distinct=True),
                total_visites=Count('id')
            )
        )

        df = pd.DataFrame(list(visiteurs))

        if df.empty:
            return []

        # 🔥 suspect si même pièce identité avec plusieurs noms
        suspects = df[df['noms_differents'] > 1]

        return suspects.to_dict(orient='records')


    # ================================
    # 3️⃣ DÉTECTION ANOMALIES (ML)
    # ================================
    @staticmethod
    def detect_anomalies_visiteurs():
        last_30_days = timezone.now() - timedelta(days=30)

        visiteurs = (
            Visiteur.objects
            .filter(heure_entree__gte=last_30_days)
            .values('heure_entree', 'telephone')
            .annotate(nombre_visites=Count('id'))
        )

        df = pd.DataFrame(list(visiteurs))

        if df.empty:
            return []

        df['heure_entree'] = pd.to_datetime(df['heure_entree'])
        df['hour'] = df['heure_entree'].dt.hour

        X = df[['hour', 'nombre_visites']]

        model = IsolationForest(contamination=0.05, random_state=42)
        model.fit(X)

        df['anomaly'] = model.predict(X)

        anomalies = df[df['anomaly'] == -1]

        return anomalies.to_dict(orient='records')


    # ================================
    # 4️⃣ PRÉDICTION AFFLUENCE
    # ================================
    @staticmethod
    def predict_affluence_journaliere():
        today = timezone.now().date()

        data = []
        for i in range(7):
            day = today - timedelta(days=i)
            count = Visiteur.objects.filter(
                heure_entree__date=day
            ).count()

            data.append({
                "date": str(day),
                "visites": count
            })

        moyenne = np.mean([d["visites"] for d in data]) if data else 0

        return {
            "historique": data,
            "prediction_prochain_jour": round(moyenne)
        }


    # ================================
    # 5️⃣ ALERTES TEMPS RÉEL
    # ================================
    @staticmethod
    def alertes_temps_reel():
        last_24h = timezone.now() - timedelta(hours=24)
        alertes = []

        visiteurs = Visiteur.objects.filter(heure_entree__gte=last_24h)

        for v in visiteurs:

            if v.alerte_securite:
                alertes.append({
                    "type": "CRITIQUE",
                    "message": f"⚠️ Visiteur suspect: {v.nom_complet}"
                })

            # 🔥 recalcul dynamique
            nb_visites = Visiteur.objects.filter(
                telephone=v.telephone
            ).count()

            if nb_visites >= 3:
                alertes.append({
                    "type": "SURVEILLANCE",
                    "message": f"🔁 Visites répétées: {v.nom_complet} ({nb_visites})"
                })

        # 🔥 détenus dangereux
        nb_dangereux = Detenu.objects.filter(est_dangereux=True).count()

        if nb_dangereux > 0:
            alertes.append({
                "type": "INFO",
                "message": f"🚨 {nb_dangereux} détenus à haute sécurité"
            })

        return alertes


    # ================================
    # 6️⃣ DASHBOARD GLOBAL
    # ================================
    @staticmethod
    def get_dashboard_avance():
        cache_key = "dashboard_ia_avance_v2"

        data = cache.get(cache_key)
        if data:
            return data

        data = {
            "score_visiteurs": IAAvanceService.score_visiteurs(),
            "faux_noms": IAAvanceService.detect_faux_noms(),
            "anomalies": IAAvanceService.detect_anomalies_visiteurs(),
            "prediction": IAAvanceService.predict_affluence_journaliere(),
            "alertes": IAAvanceService.alertes_temps_reel(),
        }

        cache.set(cache_key, data, timeout=60)

        return data