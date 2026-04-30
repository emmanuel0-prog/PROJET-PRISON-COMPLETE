# ==========================================
# SEED PERMISSIONS + ROLES (MODULE GLOBAL PRISON)
# ==========================================

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from users.models import Permission, RolePermission


def seed_permissions_and_roles():

    print("\n🔄 SEED GLOBAL PERMISSIONS + ROLES...\n")

    # ==========================================
    # 1. PERMISSIONS (NOUVELLES VUES)
    # ==========================================
    permissions = [

        # ===== PRISON =====
        ("Voir Prison", "view_prison", "Consulter prisons", "PRISON"),
        ("Créer Prison", "add_prison", "Créer prison", "PRISON"),
        ("Modifier Prison", "change_prison", "Modifier prison", "PRISON"),
        ("Supprimer Prison", "delete_prison", "Supprimer prison", "PRISON"),

        # ===== VIE CARCERALE =====
        ("Voir Vie Carcérale", "view_vie_carcerale", "Dashboard vie carcérale", "VIE_CARCERALE"),

        # ===== PRESENCE DETENU =====
        ("Voir Présence Détenu", "view_detenu_presence", "Liste présence détenus", "PRESENCE"),
        ("Modifier Présence Détenu", "change_detenu_presence", "Modifier présence détenu", "PRESENCE"),

        # ===== MOUVEMENT =====
        ("Voir Liste Mouvements", "view_mouvement_list", "Liste mouvements jour", "MOUVEMENT"),
        ("Créer Mouvement Entrée/Sortie", "add_mouvement_entrer_sortie", "Créer sortie détenu", "MOUVEMENT"),
        ("Modifier Mouvement Entrée/Sortie", "change_mouvement_entrer_sortie", "Retour détenu", "MOUVEMENT"),

        # ===== CONSULTATION MEDICALE =====
        ("Voir Consultation", "view_consultation", "Consulter consultations", "MEDICAL"),
        ("Créer Consultation", "add_consultation", "Créer consultation", "MEDICAL"),
        ("Modifier Consultation", "change_consultation", "Modifier consultation", "MEDICAL"),
        ("Supprimer Consultation", "delete_consultation", "Supprimer consultation", "MEDICAL"),
        ("Dashboard Médical", "view_consultation_dashboard", "Stats médicales", "MEDICAL"),

        # ===== PARQUET =====
        ("Voir Parquet", "view_parquet", "Consulter parquet", "PARQUET"),
        ("Créer Parquet", "add_parquet", "Créer parquet", "PARQUET"),
        ("Modifier Parquet", "change_parquet", "Modifier parquet", "PARQUET"),
        ("Supprimer Parquet", "delete_parquet", "Supprimer parquet", "PARQUET"),

        # ===== VISITEUR =====
        ("Voir Visiteur", "view_visiteur", "Consulter visiteurs", "VISITEUR"),
        ("Créer Visiteur", "add_visiteur", "Créer visiteur", "VISITEUR"),
        ("Modifier Visiteur", "change_visiteur", "Modifier visiteur", "VISITEUR"),
        ("Supprimer Visiteur", "delete_visiteur", "Supprimer visiteur", "VISITEUR"),

        ("Contrôler Visiteur", "control_visiteur", "Valider entrée/sortie visiteur", "VISITEUR"),
        ("Stats Visiteur", "view_stats_visiteur", "Analyse stratégique visiteurs", "VISITEUR"),

        # ===== DASHBOARD INTELLIGENCE =====
        ("Dashboard Intelligence", "dashboard_intelligence_view", "Dashboard intelligence", "DASHBOARD"),

    ]

    created = 0

    for name, code, desc, cat in permissions:
        obj, is_created = Permission.objects.get_or_create(
            code=code,
            defaults={
                "name": name,
                "description": desc,
                "category": cat
            }
        )

        if is_created:
            created += 1
            print(f"✅ Permission créée : {code}")
        else:
            print(f"ℹ️ Existe déjà : {code}")

    print(f"\n🔑 Total nouvelles permissions : {created}\n")

    # ==========================================
    # 2. ROLES (ACTEURS)
    # ==========================================
    def get_perms(codes):
        return Permission.objects.filter(code__in=codes)

    ALL = Permission.objects.all()

    ROLE_CONFIG = {

        # ===== ADMIN =====
        "ADMIN": ALL,

        # ===== DIRECTEUR =====
        "DIRECTEUR": get_perms([
            "view_prison",
            "view_vie_carcerale",
            "view_detenu_presence",
            "view_mouvement_list",
            "view_visiteur",
            "view_parquet",
            "dashboard_intelligence_view"
        ]),

        # ===== GREFFIER =====
        "GREFFIER": get_perms([
            "view_detenu_presence",
            "view_parquet",
            "view_visiteur",
            "view_mouvement_list"
        ]),

        # ===== MEDECIN =====
        "MEDECIN": get_perms([
            "view_consultation",
            "add_consultation",
            "change_consultation",
            "view_consultation_dashboard"
        ]),

        # ===== SECURITE =====
        "SECURITE": get_perms([
            "view_visiteur",
            "control_visiteur",
            "view_stats_visiteur",
            "view_mouvement_list"
        ]),

        # ===== AGENT =====
        "AGENT": get_perms([
            "view_detenu_presence",
            "change_detenu_presence",
            "view_visiteur"
        ]),
    }

    created_links = 0

    for role, perms in ROLE_CONFIG.items():
        for perm in perms:
            obj, is_created = RolePermission.objects.get_or_create(
                role=role,
                permission=perm
            )

            if is_created:
                created_links += 1
                print(f"🔗 {role} → {perm.code}")

    print("\n===================================")
    print("✅ SEED COMPLET TERMINÉ")
    print(f"🔗 Liens créés : {created_links}")
    print("===================================\n")


# ==========================================
# EXECUTION
# ==========================================
if __name__ == "__main__":
    seed_permissions_and_roles()