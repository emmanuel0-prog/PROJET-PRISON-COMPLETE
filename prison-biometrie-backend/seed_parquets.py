import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from core.models import Tribunal, Parquet


def seed_parquets():

    data = [

        # =========================
        # ⚖️ PARQUETS GÉNÉRAUX
        # =========================
        {"nom": "Parquet Général près la Cour d’Appel de Kinshasa/Gombe",
         "tribunal": "Cour d’Appel de Kinshasa/Gombe",
         "type": "PG"},

        {"nom": "Parquet Général près la Cour d’Appel de Kinshasa/Matete",
         "tribunal": "Cour d’Appel de Kinshasa/Matete",
         "type": "PG"},


        # =========================
        # 🏛 PARQUETS DE GRANDE INSTANCE
        # =========================
        {"nom": "Parquet de Grande Instance de Kinshasa/Gombe",
         "tribunal": "Tribunal de Grande Instance de Kinshasa/Gombe",
         "type": "PGI"},

        {"nom": "Parquet de Grande Instance de Kinshasa/Kalamu",
         "tribunal": "Tribunal de Grande Instance de Kinshasa/Kalamu",
         "type": "PGI"},

        {"nom": "Parquet de Grande Instance de Kinshasa/Kinkole",
         "tribunal": "Tribunal de Grande Instance de Kinshasa/Kinkole",
         "type": "PGI"},

        {"nom": "Parquet de Grande Instance de Kinshasa/Matete",
         "tribunal": "Tribunal de Grande Instance de Kinshasa/Matete",
         "type": "PGI"},

        {"nom": "Parquet de Grande Instance de Kinshasa/N’djili",
         "tribunal": "Tribunal de Grande Instance de Kinshasa/N’djili",
         "type": "PGI"},


        # =========================
        # ⚖️ PARQUETS TRIPAIX
        # =========================
        {"nom": "Parquet près Tribunal de Paix de Kinshasa/Gombe",
         "tribunal": "Tribunal de Paix de Kinshasa/Gombe",
         "type": "PP"},

        {"nom": "Parquet près Tribunal de Paix de Kinshasa/Kinkole",
         "tribunal": "Tribunal de Paix de Kinshasa/Kinkole",
         "type": "PP"},

        {"nom": "Parquet près Tribunal de Paix de Kinshasa/Lemba",
         "tribunal": "Tribunal de Paix de Kinshasa/Lemba",
         "type": "PP"},

        {"nom": "Parquet près Tribunal de Paix de Kinshasa/Matete",
         "tribunal": "Tribunal de Paix de Kinshasa/Matete",
         "type": "PP"},

        {"nom": "Parquet près Tribunal de Paix de Kinshasa/N’djili",
         "tribunal": "Tribunal de Paix de Kinshasa/N’djili",
         "type": "PP"},

        {"nom": "Parquet près Tribunal de Paix de Kinshasa/Ngaliema",
         "tribunal": "Tribunal de Paix de Kinshasa/Ngaliema",
         "type": "PP"},

        {"nom": "Parquet près Tribunal de Paix de Kinshasa/Pont Kasa-Vubu",
         "tribunal": "Tribunal de Paix de Kinshasa/Pont Kasa-Vubu",
         "type": "PP"},


        # =========================
        # ⚔️ PARQUETS MILITAIRES
        # =========================
        {"nom": "Auditorat Militaire de Garnison de Kinshasa/Gombe",
         "tribunal": "Tribunal Militaire de Garnison de Kinshasa/Gombe",
         "type": "PM"},

        {"nom": "Auditorat Militaire de Garnison de Kinshasa/Matete",
         "tribunal": "Tribunal Militaire de Garnison de Kinshasa/Matete",
         "type": "PM"},

        {"nom": "Auditorat Militaire de Garnison de Kinshasa/N’djili",
         "tribunal": "Tribunal Militaire de Garnison de Kinshasa/N’djili",
         "type": "PM"},

        {"nom": "Auditorat Militaire de Garnison de Kinshasa/Ngaliema",
         "tribunal": "Tribunal Militaire de Garnison de Kinshasa/Ngaliema",
         "type": "PM"},
    ]

    for item in data:
        try:
            tribunal = Tribunal.objects.get(nom=item["tribunal"])

            obj, created = Parquet.objects.get_or_create(
                nom=item["nom"],
                tribunal=tribunal,
                defaults={
                    "type_parquet": item["type"]
                }
            )

            if created:
                print(f"✅ Créé : {item['nom']}")
            else:
                print(f"ℹ️ Existe déjà : {item['nom']}")

        except Tribunal.DoesNotExist:
            print(f"❌ Tribunal introuvable : {item['tribunal']}")


if __name__ == "__main__":
    print("🚀 Seeding des parquets...")
    seed_parquets()
    print("✅ Terminé !")