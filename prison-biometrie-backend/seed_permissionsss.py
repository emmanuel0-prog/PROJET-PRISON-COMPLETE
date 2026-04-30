# ==========================================
# SEED PRISON SYSTEM - PERMISSIONS + ROLES
# ==========================================

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from users.models import Permission, RolePermission


# ==========================================
# 1. SEED PERMISSIONS
# ==========================================
def seed_permissions_prison():

    print("\n🔄 SEED PERMISSIONS...\n")

    permissions = [

        # ================= CANTINE =================
        ("Consulter Cantine", "consulter_cantine", "Voir articles cantine", "CANTINE"),
        ("Effectuer Achat Cantine", "effectuer_achat_cantine", "Achat cantine détenus", "CANTINE"),

        # ================= DETENU =================
        ("Voir Détenu", "view_detenu", "Consulter détenus", "DETENU"),
        ("Créer Détenu", "add_detenu", "Créer détenu", "DETENU"),
        ("Modifier Détenu", "change_detenu", "Modifier détenu", "DETENU"),
        ("Supprimer Détenu", "delete_detenu", "Supprimer détenu", "DETENU"),

        ("Libérer Détenu", "liberer_detenu", "Libération détenu", "DETENU"),
        ("Corbeille Détenu", "view_deleted_detenu", "Détenus supprimés", "DETENU"),
        ("Restaurer Détenu", "restore_detenu", "Restaurer détenu", "DETENU"),
        ("Purger Détenu", "purge_detenu", "Suppression définitive", "DETENU"),

        ("Historique Détenu", "view_detenu_history", "Historique détenu", "DETENU"),
        ("Historique Médical Détenu", "historique_detenu", "Historique médical", "DETENU"),

        ("Dashboard", "dashboard_view", "Statistiques globales", "DASHBOARD"),

        # ================= PAVILLON =================
        ("Voir Pavillon", "view_pavillon", "Consulter pavillons", "PAVILLON"),
        ("Créer Pavillon", "add_pavillon", "Créer pavillon", "PAVILLON"),
        ("Modifier Pavillon", "change_pavillon", "Modifier pavillon", "PAVILLON"),
        ("Supprimer Pavillon", "delete_pavillon", "Supprimer pavillon", "PAVILLON"),
        ("Restaurer Pavillon", "restore_pavillon", "Restaurer pavillon", "PAVILLON"),
        ("Corbeille Pavillon", "view_deleted_pavillon", "Pavillons supprimés", "PAVILLON"),
        ("Historique Pavillon", "view_pavillon_history", "Historique pavillon", "PAVILLON"),

        # ================= CELLULE =================
        ("Voir Cellule", "view_cellule", "Consulter cellules", "CELLULE"),
        ("Créer Cellule", "add_cellule", "Créer cellule", "CELLULE"),
        ("Modifier Cellule", "change_cellule", "Modifier cellule", "CELLULE"),
        ("Supprimer Cellule", "delete_cellule", "Supprimer cellule", "CELLULE"),
        ("Restaurer Cellule", "restore_cellule", "Restaurer cellule", "CELLULE"),
        ("Corbeille Cellule", "view_deleted_cellule", "Cellules supprimées", "CELLULE"),
        ("Historique Cellule", "view_cellule_history", "Historique cellule", "CELLULE"),

        # ================= AFFECTATION =================
        ("Voir Affectation Cellule", "view_affectation_cellule", "Consulter affectations", "AFFECTATION"),
        ("Créer Affectation Cellule", "add_affectation_cellule", "Affecter détenu", "AFFECTATION"),
        ("Modifier Affectation Cellule", "change_affectation_cellule", "Modifier affectation", "AFFECTATION"),
        ("Supprimer Affectation Cellule", "delete_affectation_cellule", "Supprimer affectation", "AFFECTATION"),
        ("Restaurer Affectation Cellule", "restore_affectation_cellule", "Restaurer affectation", "AFFECTATION"),
        ("Corbeille Affectation", "view_deleted_affectation_cellule", "Affectations supprimées", "AFFECTATION"),
        ("Historique Affectation", "view_affectation_cellule_history", "Historique affectation", "AFFECTATION"),

        # ================= TRIBUNAL =================
        ("Voir Tribunal", "view_tribunal", "Consulter tribunaux", "TRIBUNAL"),
        ("Créer Tribunal", "add_tribunal", "Créer tribunal", "TRIBUNAL"),
        ("Modifier Tribunal", "change_tribunal", "Modifier tribunal", "TRIBUNAL"),
        ("Supprimer Tribunal", "delete_tribunal", "Supprimer tribunal", "TRIBUNAL"),

        # ================= MOUVEMENT =================
        ("Voir Mouvement", "view_mouvement", "Consulter mouvements", "MOUVEMENT"),
        ("Créer Mouvement", "add_mouvement", "Créer mouvement", "MOUVEMENT"),
        ("Modifier Mouvement", "change_mouvement", "Modifier mouvement", "MOUVEMENT"),
        ("Supprimer Mouvement", "delete_mouvement", "Supprimer mouvement", "MOUVEMENT"),
        ("Restaurer Mouvement", "restore_mouvement", "Restaurer mouvement", "MOUVEMENT"),
        ("Corbeille Mouvement", "view_deleted_mouvement", "Mouvements supprimés", "MOUVEMENT"),
        ("Historique Mouvement", "view_mouvement_history", "Historique mouvement", "MOUVEMENT"),
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


# ==========================================
# 2. SEED ROLES
# ==========================================
def seed_roles_permissions():

    print("\n🔄 SEED ROLES...\n")

    ALL = Permission.objects.all()

    ROLE_CONFIG = {

        # 🔥 FULL ACCESS
        "ADMIN": ALL,
        "MINISTRE": ALL,

        # 🔵 DIRECTEUR
        "DIRECTEUR": Permission.objects.filter(code__in=[
            "dashboard_view",
            "view_detenu", "add_detenu", "change_detenu",
            "view_pavillon", "view_cellule",
            "view_affectation_cellule",
            "view_mouvement",
            "view_tribunal",
            "view_detenu_history"
        ]),

        # 🔵 GREFFIER
        "GREFFIER": Permission.objects.filter(code__in=[
            "view_detenu",
            "view_detenu_history",
            "view_mouvement",
            "view_tribunal",
            "view_pavillon",
            "view_cellule"
        ]),

        # 🔵 MEDECIN
        "MEDECIN": Permission.objects.filter(code__in=[
            "view_detenu",
            "historique_detenu",
            "view_detenu_history"
        ]),

        # 🔵 INTENDANT
        "INTENDANT": Permission.objects.filter(code__in=[
            "consulter_cantine",
            "effectuer_achat_cantine",
            "view_detenu"
        ]),

        # 🔵 AGENT
        "AGENT": Permission.objects.filter(code__in=[
            "view_detenu",
            "change_detenu",
            "view_cellule",
            "view_pavillon",
            "view_affectation_cellule",
            "add_affectation_cellule"
        ]),

        # 🔵 SECURITE
        "SECURITE": Permission.objects.filter(code__in=[
            "view_detenu",
            "view_mouvement",
            "change_mouvement",
            "view_cellule",
            "view_affectation_cellule",
            "historique_detenu"
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


# ==========================================
# EXECUTION
# ==========================================
if __name__ == "__main__":
    seed_permissions_prison()
    seed_roles_permissions()