# ==========================================
# SEED PERMISSIONS + ROLE PERMISSIONS (API PRISON)
# ==========================================

import os
import django

# 🔧 Config Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from users.models import Permission, RolePermission


def seed_permissionss():

    print("\n🔄 Début du seed des permissions API...\n")

    # ==========================================
    # 1. LISTE DES PERMISSIONS (NOUVELLES APIs)
    # ==========================================
    permissions = [

        # ===== ABSENCES =====
        ("Voir Absences", "view_absence", "Consulter les absences", "ABSENCE"),
        ("Créer Absence", "add_absence", "Créer une absence", "ABSENCE"),
        ("Modifier Absence", "change_absence", "Modifier une absence", "ABSENCE"),
        ("Supprimer Absence", "delete_absence", "Supprimer une absence", "ABSENCE"),

        # ===== PLANNING =====
        ("Voir Planning", "view_planning", "Consulter planning", "PLANNING"),
        ("Créer Planning", "add_planning", "Créer planning", "PLANNING"),
        ("Modifier Planning", "change_planning", "Modifier planning", "PLANNING"),
        ("Supprimer Planning", "delete_planning", "Supprimer planning", "PLANNING"),
        ("Stats Planning", "view_planning_stats", "Voir statistiques", "PLANNING"),

        # ===== ACTIVITES =====
        ("Voir Activités", "view_activite", "Consulter activités", "ACTIVITE"),
        ("Créer Activité", "add_activite", "Créer activité", "ACTIVITE"),
        ("Modifier Activité", "change_activite", "Modifier activité", "ACTIVITE"),
        ("Supprimer Activité", "delete_activite", "Supprimer activité", "ACTIVITE"),

        # ===== RATIONS =====
        ("Voir Rations", "view_ration", "Consulter rations", "RATION"),
        ("Créer Ration", "add_ration", "Créer ration", "RATION"),
        ("Modifier Ration", "change_ration", "Modifier ration", "RATION"),
        ("Supprimer Ration", "delete_ration", "Supprimer ration", "RATION"),

        # ===== CORVEES =====
        ("Voir Corvées", "view_corvee", "Consulter corvées", "CORVEE"),
        ("Créer Corvée", "add_corvee", "Créer corvée", "CORVEE"),
        ("Modifier Corvée", "change_corvee", "Modifier corvée", "CORVEE"),
        ("Supprimer Corvée", "delete_corvee", "Supprimer corvée", "CORVEE"),

        # ===== DECES =====
        ("Voir Décès", "view_deces", "Consulter décès", "DECES"),
        ("Valider Décès", "valider_deces", "Valider décès", "DECES"),
        ("Enquête Décès", "enquete_deces", "Lancer enquête décès", "DECES"),
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

        # 🔥 ADMIN = TOUT
        "ADMIN": ALL_PERMS,

        # 🔥 DIRECTEUR = gestion globale
        "DIRECTEUR": [
            "view_absence", "change_absence",
            "view_planning", "view_planning_stats",
            "view_activite",
            "view_ration",
            "view_corvee",
            "view_deces"
        ],

        # 🔥 AGENT = opération terrain
        "AGENT": [
            "view_planning",
            "view_activite",
            "view_corvee",
            "change_corvee"
        ],

        # 🔥 RH = absences + planning
        "RH": [
            "view_absence", "add_absence", "change_absence",
            "view_planning", "add_planning", "change_planning"
        ],

        # 🔥 INTENDANT = rations
        "INTENDANT": [
            "view_ration", "add_ration", "change_ration"
        ],

        # 🔥 SECURITE
        "SECURITE": [
            "view_corvee",
            "change_corvee",
            "view_deces"
        ],

        # 🔥 MEDECIN
        "MEDECIN": [
            "view_deces",
            "enquete_deces"
        ],
    }

    created_links = 0

    for role, perms in ROLE_CONFIG.items():

        # Cas ADMIN
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
    seed_permissionss()