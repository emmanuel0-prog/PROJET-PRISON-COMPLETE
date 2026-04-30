from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from django.core.cache import cache

# Assure-toi que les imports correspondent bien à l'arborescence de tes apps
from core.models import Detenu, MouvementExterieur, Visiteur, Liberation
from biometrie.models import EmpreinteDigitale


class DashboardService:

    # ================================
    # KPI GLOBALS (Mise à jour avec tous les statuts)
    # ================================
    @staticmethod
    def get_kpis():
        # On exclut les détenus dans la corbeille pour des stats réelles
        base_qs = Detenu.objects.filter(est_supprime=False)
        total = base_qs.count()

        # Récupération optimisée de tous les statuts en une seule requête DB
        stats_statut = base_qs.values('statut_juridique').annotate(total=Count('id'))
        statuts_dict = {item['statut_juridique']: item['total'] for item in stats_statut}

        prevenus = statuts_dict.get('PREVENU', 0)
        detenus_preventifs = statuts_dict.get('DETENU_PREVENTIF', 0)
        condamnes = statuts_dict.get('CONDAMNE', 0)
        condamnes_preventifs = statuts_dict.get('CONDAMNE_PREVENTIF', 0)
        liberes = statuts_dict.get('LIBERE', 0)
        morts = statuts_dict.get('MORT', 0)

        # Biométrie
        avec_bio = EmpreinteDigitale.objects.filter(
            code_empreinte__isnull=False
        ).count()

        taux_bio = (avec_bio / total * 100) if total > 0 else 0

        return {
            "total_actifs": total - liberes - morts, # Total des personnes physiquement présentes/sous écrou
            "total_absolu": total,
            "statuts": {
                "prevenus": prevenus,
                "detenus_preventifs": detenus_preventifs,
                "condamnes": condamnes,
                "condamnes_preventifs": condamnes_preventifs,
                "liberes": liberes,
                "morts": morts,
            },
            "taux_biometrique": round(taux_bio, 1),
            "taux_occupation": 245 # À dynamiser plus tard selon la capacité des prisons
        }

    # ================================
    # STATISTIQUES LIBÉRATIONS (Nouveau)
    # ================================
    @staticmethod
    def get_liberation_stats():
        total_liberations = Liberation.objects.count()

        # Dossiers où au moins une étape du workflow n'est pas validée
        en_attente = Liberation.objects.filter(
            Q(workflow_juridictionnelle=False) |
            Q(workflow_parquet=False) |
            Q(workflow_greffe=False) |
            Q(workflow_restitution=False)
        ).count()

        # Dossiers 100% complétés
        terminees = Liberation.objects.filter(
            workflow_juridictionnelle=True,
            workflow_parquet=True,
            workflow_greffe=True,
            workflow_restitution=True
        ).count()

        return {
            "total_dossiers_liberation": total_liberations,
            "dossiers_en_attente": en_attente,
            "dossiers_termines": terminees,
            "taux_completion": round((terminees / total_liberations * 100), 1) if total_liberations > 0 else 0
        }

    # ================================
    # EVOLUTION MENSUELLE
    # ================================
    @staticmethod
    def get_evolution():
        now = timezone.now()
        data = []

        for i in range(6, -1, -1):
            start = now - timedelta(days=30 * i)
            end = start + timedelta(days=30)

            entrees = Detenu.objects.filter(
                date_entree__range=(start, end),
                est_supprime=False
            ).count()

            sorties = MouvementExterieur.objects.filter(
                heure_sortie__range=(start, end),
                statut='RETOURNE'
            ).count()

            data.append({
                "mois": start.strftime("%b"),
                "entrees": entrees,
                "sorties": sorties
            })

        return data

    # ================================
    # MOUVEMENTS RECENTS
    # ================================
    @staticmethod
    def get_mouvements_recents():
        mouvements = MouvementExterieur.objects.select_related('detenu') \
            .order_by('-heure_sortie')[:10]

        return [
            {
                "id": m.id,
                "detenu": f"{m.detenu.nom} {m.detenu.postnom}",
                "type": "SORTIE" if m.statut == "HORS MURS" else "ENTREE",
                "date": m.heure_sortie
            }
            for m in mouvements
        ]

    # ================================
    # INFRACTIONS 
    # ================================
    @staticmethod
    def get_infractions():
        data = Detenu.objects.filter(est_supprime=False).values(
            'dossier_judiciaire__chef_inculpation'
        ).annotate(
            total=Count('id')
        ).order_by('-total')[:5]

        return [
            {
                "categorie": d['dossier_judiciaire__chef_inculpation'] or "Inconnu",
                "total": d['total']
            }
            for d in data
        ]

    # ================================
    # GEO 
    # ================================
    @staticmethod
    def get_geographie():
        data = Detenu.objects.filter(est_supprime=False).values(
            'prison__ville__province__nom'
        ).annotate(
            total=Count('id')
        ).order_by('-total')

        return [
            {
                "province": d['prison__ville__province__nom'] or "N/A",
                "total": d['total']
            }
            for d in data
        ]

    # ================================
    # INTELLIGENCE VISITEURS
    # ================================
    @staticmethod
    def get_intelligence():
        last_30_days = timezone.now() - timedelta(days=30)

        visiteurs = Visiteur.objects.filter(
            heure_entree__gte=last_30_days
        ).select_related('detenu_visite')[:10]

        result = []

        for v in visiteurs:
            nb_visites = Visiteur.objects.filter(
                nom_complet=v.nom_complet,
                heure_entree__gte=last_30_days
            ).count()

            risque = "FAIBLE"

            if getattr(v, 'alerte_securite', False): # Sécurité si le champ n'existe pas encore partout
                risque = "CRITIQUE"
            elif nb_visites >= 3:
                risque = "MODERE"

            result.append({
                "nom": v.nom_complet,
                "detenu": v.detenu_visite.nom if getattr(v, 'detenu_visite', None) else "N/A",
                "risque": risque,
                "visites": nb_visites
            })

        return result

    # ================================
    # DASHBOARD AVEC CACHE
    # ================================
    @staticmethod
    def get_dashboard():
        cache_key = "dashboard_data_v2" # J'ai changé la clé de cache pour éviter les conflits avec l'ancienne version

        try:
            data = cache.get(cache_key)
        except:
            data = None

        if data:
            return data

        data = {
            "kpis": DashboardService.get_kpis(),
            "liberations": DashboardService.get_liberation_stats(), # Ajout des nouvelles stats ici !
            "evolution": DashboardService.get_evolution(),
            "mouvements": DashboardService.get_mouvements_recents(),
            "infractions": DashboardService.get_infractions(),
            "geographie": DashboardService.get_geographie(),
            "intelligence": DashboardService.get_intelligence(),
        }

        try:
            cache.set(cache_key, data, timeout=60)
        except:
            pass

        return data