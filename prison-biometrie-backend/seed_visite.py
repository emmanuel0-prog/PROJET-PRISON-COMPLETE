import os
import django
import random
import uuid
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from core.models import Visiteur, Detenu


# ===========================
# DONNEES REALISTES
# ===========================
NOMS = [
    "Jean Dupont", "Paul Mukendi", "Marie Kabila", "Sarah Nzambe",
    "David Tshisekedi", "Patrick Ilunga", "Michel Nzambe",
    "Grace Mbala", "Esther Mbuyi", "Daniel Kasongo",
    "Joseph Mavungu", "Claude Banza", "Kevin Lufungula"
]

TELEPHONES = [
    "0991111111", "0812222222", "0823333333",
    "0974444444", "0905555555", "0999999999"
]

PIECES = [
    "ID123", "ID456", "ID789", "ID321", "ID654"
]

TYPES = ['FAMILLE', 'AMI', 'AVOCAT', 'PROFESSIONNEL']


# ===========================
# TOKEN UNIQUE
# ===========================
def generate_token():
    return f"VISIT-{random.randint(1000,9999)}"


# ===========================
# SEED PRINCIPAL
# ===========================
def seed_visiteurs(n=200):

    detenus = list(Detenu.objects.all())

    if not detenus:
        print("❌ Aucun détenu trouvé. Lance seed_detenus d'abord.")
        return

    for i in range(n):

        detenu = random.choice(detenus)

        nom = random.choice(NOMS)
        tel = random.choice(TELEPHONES)
        piece = random.choice(PIECES)

        # ===========================
        # 🔥 CAS 1 : FAUX NOM
        # ===========================
        if random.random() < 0.25:
            piece = "ID_FAUX"
            nom = random.choice(NOMS)

        # ===========================
        # 🔥 CAS 2 : VISITE REPETEE
        # ===========================
        if random.random() < 0.30:
            tel = "0999999999"

        # ===========================
        # 🔥 CAS 3 : ALERTE SECURITE
        # ===========================
        alerte = random.random() < 0.15

        # ===========================
        # 🔥 CAS 4 : HEURE ANORMALE (ML)
        # ===========================
        random_days = random.randint(0, 30)
        random_hour = random.choice([8, 10, 14, 16, 23, 2])  # 2h et 23h = suspect

        date = timezone.now() - timedelta(days=random_days)
        date = date.replace(hour=random_hour)

        # ===========================
        # CREATION
        # ===========================
        Visiteur.objects.create(
            uuid_national=uuid.uuid4(),
            token=generate_token(),
            nom_complet=nom,
            telephone=tel,
            piece_identite_numero=piece,
            detenu_visite=detenu,
            type_visiteur=random.choice(TYPES),
            relation_detenu="Proche",
            alerte_securite=alerte,
            heure_entree=date,
            statut=random.choice(['EN ATTENTE', 'TERMINE', 'REFUSE'])
        )

        print(f"✅ Visiteur {i+1}/{n} créé : {nom}")

    print(f"\n🎯 {n} visiteurs générés avec succès pour IA !")


# ===========================
# EXECUTION
# ===========================
if __name__ == "__main__":
    print("🚀 Génération visiteurs intelligents...")
    seed_visiteurs(200)
    print("✅ Terminé !")