# ==========================================
# SEED - DERNIÈRES VUES DASHBOARD
# ==========================================

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()


from users.models import Permission, RolePermission, User


# =========================================================
# 🔐 CREATE PERMISSION
# =========================================================
def create_permission(name, code, category="DASHBOARD"):
    perm, created = Permission.objects.get_or_create(
        code=code,
        defaults={
            "name": name,
            "category": category
        }
    )

    if created:
        print(f"✅ {code}")
    else:
        print(f"ℹ️ existe : {code}")

    return perm


# =========================================================
# 🔐 SEED PERMISSIONS (7 VUES)
# =========================================================
def seed_permissions():

    print("\n🔄 SEED PERMISSIONS (7 VUES)...\n")

    permissions = [

        # 1. DASHBOARD GLOBAL
# ================= DECES =================
("Voir Décès", "view_deces", "DECES"),
("Créer Décès", "add_deces", "DECES"),
("Modifier Décès", "change_deces", "DECES"),

("Valider Décès", "valider_deces", "DECES"),
("Mettre en enquête Décès", "enquete_deces", "DECES"),

("Supprimer Décès (soft delete)", "delete_deces", "DECES"),
("Restaurer Décès", "restore_deces", "DECES"),
("Suppression définitive Décès", "hard_delete_deces", "DECES"),
    ]

    for name, code, category in permissions:
        create_permission(name, code, category)

    print("\n✅ PERMISSIONS OK\n")



# =========================================================
# 🚀 EXECUTION
# =========================================================
if __name__ == "__main__":
    print("\n🚀 SEED 7 VUES EN COURS...\n")

    seed_permissions()
    

    print("\n🔥 TERMINÉ AVEC SUCCÈS 🔥\n")