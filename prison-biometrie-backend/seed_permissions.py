# ==========================================
# SEED PERMISSIONS + ROLE PERMISSIONS (PROPRE)
# ==========================================

import os
import django

# 🔧 Config Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from users.models import User, Permission, RolePermission


def seed_permissions():

    print("\n🔄 Début du seed des permissions...\n")

    # ==========================================
    # 1. LISTE DES PERMISSIONS
    # ==========================================
    permissions = [

        # ===== PARQUET =====
        ("Voir Parquets", "voir_parquets", "Lecture des parquets", "PARQUET"),
        ("Gérer Parquets", "gerer_parquets", "Gestion des parquets", "PARQUET"),

        # ===== DOSSIERS =====
        ("Voir Dossiers", "voir_dossiers", "Lecture dossiers judiciaires", "DOSSIER"),
        ("Gérer Dossiers", "gerer_dossiers", "Gestion dossiers judiciaires", "DOSSIER"),

        # ===== DOCUMENTS =====
        ("Voir Documents", "voir_documents", "Lecture documents écrou", "DOCUMENT"),
        ("Gérer Documents", "gerer_documents", "CRUD documents écrou", "DOCUMENT"),
        ("Audit Documents", "audit_documents", "Historique documents", "DOCUMENT"),

        # ===== CANTINE =====
        ("Consulter Cantine", "consulter_cantine", "Voir articles cantine", "CANTINE"),
        ("Effectuer Achat", "effectuer_achat_cantine", "Faire achat cantine", "CANTINE"),

        # ===== DETENUS =====
        ("Voir Détenus", "voir_detenus", "Consulter détenus", "DETENU"),
        ("Gérer Détenus", "gerer_detenus", "CRUD détenus", "DETENU"),
        ("Libérer Détenu", "liberer_detenu", "Procédure de libération", "DETENU"),
        ("Corbeille Détenu", "corbeille_detenu", "Voir corbeille", "DETENU"),
        ("Restaurer Détenu", "restaurer_detenu", "Restaurer détenu", "DETENU"),
        ("Purger Détenu", "purger_detenu", "Suppression définitive", "DETENU"),
        ("Historique Détenu", "historique_detenu", "Voir historique", "DETENU"),
        ("Update Statut", "update_status_detenu", "Modifier statut détenu", "DETENU"),
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

    print(f"\n✅ Total nouvelles permissions : {created}\n")

    # ==========================================
    # 2. ASSIGNATION AUX ROLES
    # ==========================================
    print("🔐 Attribution des permissions aux rôles...\n")

    ALL_PERMS = list(Permission.objects.all())

    ROLE_CONFIG = {

        "ADMIN": ALL_PERMS,

        "MINISTRE": ALL_PERMS,

        "DIRECTEUR": [
            "voir_detenus", "gerer_detenus",
            "voir_dossiers", "gerer_dossiers",
            "voir_documents", "gerer_documents"
        ],

        "GREFFIER": [
            "voir_dossiers", "gerer_dossiers",
            "voir_documents", "audit_documents"
        ],

        "MEDECIN": [
            "voir_detenus",
            "historique_detenu"
        ],

        "INTENDANT": [
            "consulter_cantine",
            "effectuer_achat_cantine"
        ],

        "AGENT": [
            "voir_detenus",
            "update_status_detenu"
        ],

        "SECURITE": [
            "voir_detenus",
            "historique_detenu"
        ],
    }

    created_links = 0

    for role, perms in ROLE_CONFIG.items():

        # Cas ADMIN / MINISTRE (toutes permissions)
        if perms == ALL_PERMS:
            perm_objects = ALL_PERMS
        else:
            perm_objects = Permission.objects.filter(code__in=perms)

        for perm in perm_objects:
            obj, is_created = RolePermission.objects.get_or_create(
                role=role,
                permission=perm
            )

            if is_created:
                created_links += 1
                print(f"🔗 {role} → {perm.code}")

    print("\n===================================")
    print("✅ SEED TERMINÉ AVEC SUCCÈS")
    print(f"🔑 Permissions créées : {created}")
    print(f"🔗 Assignations créées : {created_links}")
    print("===================================\n")


# ==========================================
# EXECUTION
# ==========================================
if __name__ == "__main__":
    seed_permissions()