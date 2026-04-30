# ==========================================
# 🚀 SEED PRISON SYSTEM (CUSTOM PERMISSIONS)
# ==========================================

import os
import django

# 🔥 CONFIG DJANGO (ADAPTE SI BESOIN)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from users.models import Permission, RolePermission, User


# =========================================================
# 🔐 SEED PERMISSIONS (TES VUES UNIQUEMENT)
# =========================================================
def seed_permissions():

    print("\n🔄 CREATION DES PERMISSIONS...\n")

    permissions = [

        # ================= PRISON =================
        ("Voir prisons", "view_prison", "Consulter les prisons", "PRISON"),
        ("Créer prison", "add_prison", "Ajouter une prison", "PRISON"),
        ("Modifier prison", "change_prison", "Modifier une prison", "PRISON"),
        ("Supprimer prison", "delete_prison", "Supprimer une prison", "PRISON"),

        # ================= VIE CARCERALE =================
        ("Voir vie carcérale", "view_vie_carcerale", "Dashboard vie carcérale", "VIE_CARCERALE"),

        # ================= PRESENCE =================
        ("Voir présence détenus", "view_detenu_presence", "Liste présence", "PRESENCE"),
        ("Modifier présence détenus", "change_detenu_presence", "Changer statut présence", "PRESENCE"),

        # ================= MOUVEMENTS =================
        ("Voir mouvements", "view_mouvement_list", "Liste mouvements", "MOUVEMENT"),
        ("Créer mouvement", "add_mouvement_entrer_sortie", "Sortie détenu", "MOUVEMENT"),
        ("Modifier mouvement", "change_mouvement_entrer_sortie", "Retour détenu", "MOUVEMENT"),

        # ================= CONSULTATION =================
        ("Voir consultations", "view_consultation", "Liste consultations", "MEDICAL"),
        ("Créer consultation", "add_consultation", "Nouvelle consultation", "MEDICAL"),
        ("Modifier consultation", "change_consultation", "Modifier consultation", "MEDICAL"),
        ("Supprimer consultation", "delete_consultation", "Supprimer consultation", "MEDICAL"),
        ("Dashboard médical", "view_consultation_dashboard", "Stats médicales", "MEDICAL"),

        # ================= PARQUET =================
        ("Voir parquet", "view_parquet", "Liste parquet", "PARQUET"),
        ("Créer parquet", "add_parquet", "Créer parquet", "PARQUET"),
        ("Modifier parquet", "change_parquet", "Modifier parquet", "PARQUET"),
        ("Supprimer parquet", "delete_parquet", "Supprimer parquet", "PARQUET"),

        # ================= VISITEUR =================
        ("Voir visiteurs", "view_visiteur", "Liste visiteurs", "VISITEUR"),
        ("Créer visiteur", "add_visiteur", "Enregistrer visiteur", "VISITEUR"),
        ("Modifier visiteur", "change_visiteur", "Modifier visiteur", "VISITEUR"),
        ("Supprimer visiteur", "delete_visiteur", "Supprimer visiteur", "VISITEUR"),
        ("Contrôle visiteur", "control_visiteur", "Entrée / Sortie visiteur", "VISITEUR"),
        ("Stats visiteurs", "view_stats_visiteur", "Analyse visiteurs", "VISITEUR"),

        # ================= DETENU =================
        ("Voir détenu", "view_detenu", "Recherche détenu", "DETENU"),

        # ================= INTELLIGENCE =================
        ("Dashboard intelligence", "dashboard_intelligence_view", "Analyse stratégique", "INTELLIGENCE"),
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
            print(f"✅ {code}")
        else:
            print(f"ℹ️ existe : {code}")

    print(f"\n✔ Permissions créées : {created}\n")


# =========================================================
# 👥 SEED ROLES (TES ROLES UNIQUEMENT)
# =========================================================
def seed_roles():

    print("\n🔄 CREATION DES ROLES...\n")

    ROLE_CONFIG = {

        # 🔥 FULL ACCESS
        "ADMIN": Permission.objects.all(),
        "MINISTRE": Permission.objects.all(),

        # ================= DIRECTEUR =================
        "DIRECTEUR": Permission.objects.filter(code__in=[
            "view_prison",
            "view_vie_carcerale",
            "view_detenu",
            "view_mouvement_list",
            "view_parquet",
            "view_visiteur",
            "view_stats_visiteur",
            "dashboard_intelligence_view"
        ]),

        # ================= GREFFIER =================
        "GREFFIER": Permission.objects.filter(code__in=[
            "view_detenu",
            "view_mouvement_list",
            "view_parquet"
        ]),

        # ================= MEDECIN =================
        "MEDECIN": Permission.objects.filter(code__in=[
            "view_consultation",
            "add_consultation",
            "change_consultation",
            "view_consultation_dashboard"
        ]),

        # ================= INTENDANT =================
        "INTENDANT": Permission.objects.filter(code__in=[
            "view_detenu",
            "view_vie_carcerale"
        ]),

        # ================= AGENT =================
        "AGENT": Permission.objects.filter(code__in=[
            "view_detenu",
            "view_detenu_presence",
            "change_detenu_presence",
            "view_mouvement_list",
            "add_mouvement_entrer_sortie",
            "change_mouvement_entrer_sortie"
        ]),

        # ================= SECURITE =================
        "SECURITE": Permission.objects.filter(code__in=[
            "view_detenu",
            "view_visiteur",
            "control_visiteur",
            "view_stats_visiteur"
        ]),
    }

    created_links = 0

    for role, perms in ROLE_CONFIG.items():

        for perm in perms:

            obj, created = RolePermission.objects.get_or_create(
                role=role,
                permission=perm
            )

            if created:
                created_links += 1
                print(f"🔗 {role} → {perm.code}")

    print("\n===================================")
    print("✅ SEED ROLES TERMINÉ")
    print(f"🔗 liens créés : {created_links}")
    print("===================================\n")


# =========================================================
# 🚀 EXECUTION
# =========================================================
if __name__ == "__main__":
    print("\n🚀 SEED EN COURS...\n")

    seed_permissions()
    seed_roles()

    print("\n🎯 TERMINÉ AVEC SUCCÈS\n")