# ==========================================
# SEED GLOBAL - VERSION SCRIPT (STANDALONE)
# ==========================================

import os
import django

# 🔧 Config Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from users.models import Permission, RolePermission


def seed_permissions():

    print("\n🔄 Début du seed GLOBAL...\n")

    # ==========================================
    # 1. PERMISSIONS
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
        ("Consulter Cantine", "consulter_cantine", "Voir articles", "CANTINE"),
        ("Effectuer Achat", "effectuer_achat_cantine", "Achat cantine", "CANTINE"),

        # ===== DETENUS =====
        ("Voir Détenus", "voir_detenus", "Consulter détenus", "DETENU"),
        ("Gérer Détenus", "gerer_detenus", "CRUD détenus", "DETENU"),
        ("Libérer Détenu", "liberer_detenu", "Libération détenu", "DETENU"),
        ("Corbeille Détenu", "corbeille_detenu", "Voir corbeille", "DETENU"),
        ("Restaurer Détenu", "restaurer_detenu", "Restaurer détenu", "DETENU"),
        ("Purger Détenu", "purger_detenu", "Suppression définitive", "DETENU"),
        ("Historique Détenu", "historique_detenu", "Voir historique", "DETENU"),
        ("Update Statut", "update_status_detenu", "Changer statut", "DETENU"),

        # ===== PAVILLON =====
        ("Voir Pavillons", "voir_pavillons", "Consulter pavillons", "PAVILLON"),
        ("Gérer Pavillons", "gerer_pavillons", "CRUD pavillons", "PAVILLON"),
        ("Corbeille Pavillons", "corbeille_pavillons", "Voir pavillons supprimés", "PAVILLON"),
        ("Restaurer Pavillon", "restaurer_pavillon", "Restaurer pavillon", "PAVILLON"),
        ("Historique Pavillon", "historique_pavillon", "Voir historique pavillon", "PAVILLON"),

        # ===== CELLULE =====
        ("Voir Cellules", "voir_cellules", "Consulter cellules", "CELLULE"),
        ("Gérer Cellules", "gerer_cellules", "CRUD cellules", "CELLULE"),
        ("Corbeille Cellules", "corbeille_cellules", "Voir cellules supprimées", "CELLULE"),
        ("Restaurer Cellule", "restaurer_cellule", "Restaurer cellule", "CELLULE"),
        ("Historique Cellule", "historique_cellule", "Voir historique cellule", "CELLULE"),

        # ===== AFFECTATION =====
        ("Voir Affectations", "voir_affectations", "Consulter affectations", "AFFECTATION"),
        ("Gérer Affectations", "gerer_affectations", "CRUD affectations", "AFFECTATION"),
        ("Corbeille Affectations", "corbeille_affectations", "Voir affectations supprimées", "AFFECTATION"),
        ("Restaurer Affectation", "restaurer_affectation", "Restaurer affectation", "AFFECTATION"),
        ("Historique Affectation", "historique_affectation", "Voir historique affectation", "AFFECTATION"),

        # ===== TRIBUNAL =====
        ("Voir Tribunaux", "voir_tribunaux", "Consulter tribunaux", "TRIBUNAL"),
        ("Gérer Tribunaux", "gerer_tribunaux", "CRUD tribunaux", "TRIBUNAL"),

        # ===== MOUVEMENT =====
        ("Voir Mouvements", "voir_mouvements", "Consulter mouvements", "MOUVEMENT"),
        ("Gérer Mouvements", "gerer_mouvements", "CRUD mouvements", "MOUVEMENT"),
        ("Corbeille Mouvements", "corbeille_mouvements", "Voir mouvements supprimés", "MOUVEMENT"),
        ("Restaurer Mouvement", "restaurer_mouvement", "Restaurer mouvement", "MOUVEMENT"),
        ("Historique Mouvement", "historique_mouvement", "Voir historique mouvement", "MOUVEMENT"),
        ("Enregistrer Sortie", "enregistrer_sortie", "Sortie détenu", "MOUVEMENT"),
        ("Retour Détenu", "retour_detenu", "Retour détenu", "MOUVEMENT"),
        ("Vérifier Détenu", "verifier_detenu", "Recherche détenu", "MOUVEMENT"),
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
            print(f"✅ Créée : {code}")
        else:
            print(f"ℹ️ Existe : {code}")

    print(f"\n🔑 Total nouvelles permissions : {created}\n")

    # ==========================================
    # 2. ROLES
    # ==========================================
    print("🔐 Attribution des permissions...\n")

    ALL_PERMS = list(Permission.objects.all())

    ROLE_CONFIG = {

        "ADMIN": ALL_PERMS,
        "MINISTRE": ALL_PERMS,

        "DIRECTEUR": [
            "voir_detenus", "gerer_detenus",
            "voir_dossiers", "gerer_dossiers",
            "voir_documents", "gerer_documents",
            "voir_pavillons", "gerer_pavillons",
            "voir_cellules", "gerer_cellules",
            "voir_affectations", "gerer_affectations",
            "voir_mouvements", "gerer_mouvements",
            "voir_tribunaux"
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
            "update_status_detenu",
            "voir_cellules",
            "voir_affectations",
            "verifier_detenu",
            "enregistrer_sortie",
            "retour_detenu"
        ],

        "SECURITE": [
            "voir_detenus",
            "historique_detenu",
            "voir_mouvements",
            "historique_mouvement"
        ],
    }

    created_links = 0

    for role, perms in ROLE_CONFIG.items():

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
    print("✅ SEED GLOBAL TERMINÉ")
    print(f"🔑 Permissions créées : {created}")
    print(f"🔗 Assignations : {created_links}")
    print("===================================\n")


# ==========================================
# EXECUTION
# ==========================================
if __name__ == "__main__":
    seed_permissions()