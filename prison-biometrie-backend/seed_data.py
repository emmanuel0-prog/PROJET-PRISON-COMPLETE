import os
import django

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from users.models import User, Permission, RolePermission

def seed():
    print("🚀 Initialisation des données système...")

    # 1. Création des Permissions
    perms_data = [
        {"name": "Gérer Utilisateurs", "code": "manage_users", "category": "ADMIN"},
        {"name": "Voir Rapports Sécurité", "code": "view_security", "category": "SECURITE"},
        {"name": "Éditer Dossier Médical", "code": "edit_medical", "category": "MEDICAL"},
        {"name": "Gérer Inventaire", "code": "manage_stock", "category": "LOGISTIQUE"},
    ]

    created_perms = {}
    for p in perms_data:
        obj, created = Permission.objects.get_or_create(code=p['code'], defaults=p)
        created_perms[p['code']] = obj
        if created: print(f"✅ Permission créée : {p['code']}")

    # 2. Assignation des Permissions aux Rôles
    role_mapping = {
        'ADMIN': ['manage_users', 'view_security', 'edit_medical', 'manage_stock'],
        'MEDECIN': ['edit_medical'],
        'SECURITE': ['view_security'],
        'AGENT': [],
    }

    for role, codes in role_mapping.items():
        for code in codes:
            RolePermission.objects.get_or_create(role=role, permission=created_perms[code])
        print(f"🔐 Rôle {role} configuré avec {len(codes)} permissions.")

    # 3. Création d'un Super-Utilisateur Admin
    if not User.objects.filter(username="admin_system").exists():
        User.objects.create_superuser(
            username="admin_system",
            email="admin@prison.gov",
            password="Password123!",
            role="ADMIN"
        )
        print("👤 Super-utilisateur créé : admin_system / Password123!")

if __name__ == "__main__":
    seed()