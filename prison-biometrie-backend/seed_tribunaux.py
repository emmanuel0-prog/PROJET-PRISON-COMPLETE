import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from core.models import Tribunal


def seed_tribunaux():
    tribunaux = [

        # =========================
        # ⚖️ JURIDICTIONS CIVILES
        # =========================

        # Niveau national
        {"nom": "Cour Constitutionnelle", "type_juridiction": "COUR_CONSTITUTIONNELLE", "ville": "Kinshasa", "commune": "Gombe"},
        {"nom": "Cour de Cassation", "type_juridiction": "COUR_CASSATION", "ville": "Kinshasa", "commune": "Gombe"},
        {"nom": "Conseil d’Etat", "type_juridiction": "CONSEIL_ETAT", "ville": "Kinshasa", "commune": "Gombe"},

        # Cours d'appel
        {"nom": "Cour d’Appel de Kinshasa/Gombe", "type_juridiction": "COUR_APPEL", "ville": "Kinshasa", "commune": "Gombe"},
        {"nom": "Cour d’Appel de Kinshasa/Matete", "type_juridiction": "COUR_APPEL", "ville": "Kinshasa", "commune": "Matete"},

        # Tribunaux de grande instance
        {"nom": "Tribunal de Grande Instance de Kinshasa/Gombe", "type_juridiction": "TGI", "ville": "Kinshasa", "commune": "Gombe"},
        {"nom": "Tribunal de Grande Instance de Kinshasa/Kalamu", "type_juridiction": "TGI", "ville": "Kinshasa", "commune": "Kalamu"},
        {"nom": "Tribunal de Grande Instance de Kinshasa/Matete", "type_juridiction": "TGI", "ville": "Kinshasa", "commune": "Matete"},
        {"nom": "Tribunal de Grande Instance de Kinshasa/N’djili", "type_juridiction": "TGI", "ville": "Kinshasa", "commune": "Ndjili"},
        {"nom": "Tribunal de Grande Instance de Kinshasa/Kinkole", "type_juridiction": "TGI", "ville": "Kinshasa", "commune": "Kinkole"},

        # Tribunaux de paix
        {"nom": "Tribunal de Paix de Kinshasa/Assossa", "type_juridiction": "TRIPAIX", "ville": "Kinshasa", "commune": "Assossa"},
        {"nom": "Tribunal de Paix de Kinshasa/Gombe", "type_juridiction": "TRIPAIX", "ville": "Kinshasa", "commune": "Gombe"},
        {"nom": "Tribunal de Paix de Kinshasa/Kinkole", "type_juridiction": "TRIPAIX", "ville": "Kinshasa", "commune": "Kinkole"},
        {"nom": "Tribunal de Paix de Kinshasa/Lemba", "type_juridiction": "TRIPAIX", "ville": "Kinshasa", "commune": "Lemba"},
        {"nom": "Tribunal de Paix de Kinshasa/Matete", "type_juridiction": "TRIPAIX", "ville": "Kinshasa", "commune": "Matete"},
        {"nom": "Tribunal de Paix de Kinshasa/N’djili", "type_juridiction": "TRIPAIX", "ville": "Kinshasa", "commune": "Ndjili"},
        {"nom": "Tribunal de Paix de Kinshasa/Ngaliema", "type_juridiction": "TRIPAIX", "ville": "Kinshasa", "commune": "Ngaliema"},
        {"nom": "Tribunal de Paix de Kinshasa/Pont Kasa-Vubu", "type_juridiction": "TRIPAIX", "ville": "Kinshasa", "commune": "Kasa-Vubu"},

        # Tribunaux pour enfants
        {"nom": "Tribunal pour Enfants de Kinshasa/Gombe", "type_juridiction": "ENFANTS", "ville": "Kinshasa", "commune": "Gombe"},
        {"nom": "Tribunal pour Enfants de Kinshasa/Kalamu", "type_juridiction": "ENFANTS", "ville": "Kinshasa", "commune": "Kalamu"},
        {"nom": "Tribunal pour Enfants de Kinshasa/Matete", "type_juridiction": "ENFANTS", "ville": "Kinshasa", "commune": "Matete"},
        {"nom": "Tribunal pour Enfants de Kinshasa/Kinkole", "type_juridiction": "ENFANTS", "ville": "Kinshasa", "commune": "Kinkole"},
        {"nom": "Tribunal pour Enfants de Kinshasa/Ngaliema", "type_juridiction": "ENFANTS", "ville": "Kinshasa", "commune": "Ngaliema"},

        # =========================
        # ⚔️ JURIDICTIONS MILITAIRES
        # =========================

        # Niveau national
        {"nom": "Haute Cour Militaire", "type_juridiction": "HAUTE_COUR_MILITAIRE", "ville": "Kinshasa", "commune": "Gombe"},

        # Cours militaires
        {"nom": "Cour Militaire de Kinshasa/Gombe", "type_juridiction": "COUR_MILITAIRE", "ville": "Kinshasa", "commune": "Gombe"},
        {"nom": "Cour Militaire de Kinshasa/Matete", "type_juridiction": "COUR_MILITAIRE", "ville": "Kinshasa", "commune": "Matete"},

        # Tribunaux militaires de garnison
        {"nom": "Tribunal Militaire de Garnison de Kinshasa/Gombe", "type_juridiction": "MILITAIRE", "ville": "Kinshasa", "commune": "Gombe"},
        {"nom": "Tribunal Militaire de Garnison de Kinshasa/Matete", "type_juridiction": "MILITAIRE", "ville": "Kinshasa", "commune": "Matete"},
        {"nom": "Tribunal Militaire de Garnison de Kinshasa/N’djili", "type_juridiction": "MILITAIRE", "ville": "Kinshasa", "commune": "Ndjili"},
        {"nom": "Tribunal Militaire de Garnison de Kinshasa/Ngaliema", "type_juridiction": "MILITAIRE", "ville": "Kinshasa", "commune": "Ngaliema"},
    ]

    for data in tribunaux:
        obj, created = Tribunal.objects.get_or_create(
            nom=data['nom'],
            defaults=data
        )
        if created:
            print(f"✅ Créé : {data['nom']}")
        else:
            print(f"ℹ️ Existe déjà : {data['nom']}")


if __name__ == "__main__":
    print("🚀 Début du seeding...")
    seed_tribunaux()
    print("✅ Seeding terminé !")