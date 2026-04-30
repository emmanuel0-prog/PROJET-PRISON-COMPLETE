import os
import django
import random
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from core.models import Detenu, Prison


def seed_detenus():

    prisons = list(Prison.objects.all())

    if not prisons:
        print("❌ Aucune prison trouvée. Lance d'abord le seed des prisons.")
        return

    # ============================
    # NOMS 100% FICTIFS
    # ============================
    noms = [
        "KAMBA", "MBOKO", "KALONJI", "LUKUSA", "BAYOKA",
        "MUTOMBO", "KAFUTA", "MUNYANGI", "SIFU", "KIBALA",
        "NGOMBE", "KALENGA", "BOSOLO", "TOMBA", "LUBAYA",
        "KALUME", "MOKO", "BAMBA", "KASU", "LUSAMBO"
    ]

    postnoms = [
        "NGOMA", "KABONGO", "MUKUNA", "KALONDA", "BILALA",
        "SANGA", "MUNGA", "KATA", "LUMBU", "MPELA"
    ]

    prenoms = [
        "Jean", "Paul", "David", "Patrick", "Junior",
        "Christian", "Eric", "Samuel", "Didier", "Marc",
        "Alain", "Michel", "Roger", "Kevin", "Joel"
    ]

    professions = [
        "Chauffeur", "Commerçant", "Étudiant", "Maçon",
        "Informaticien", "Mécanicien", "Agriculteur", "Sans emploi"
    ]

    infractions = [
        "Vol simple",
        "Vol qualifié",
        "Escroquerie",
        "Fraude",
        "Coups et blessures volontaires",
        "Association de malfaiteurs",
        "Détention illégale d'armes",
        "Destruction de biens"
    ]

    etats_civils = ['CELIBATAIRE', 'MARIE', 'DIVORCE']
    sexes = ['M', 'F']
    liens_parente = ["Frère", "Sœur", "Mère", "Père", "Époux", "Oncle"]

    # ============================
    # GENERATION 50 DETENUS
    # ============================
    for i in range(50):

        sexe = random.choice(sexes)

        detenu = Detenu.objects.create(
            nom=random.choice(noms),
            postnom=random.choice(postnoms),
            prenom=random.choice(prenoms),
            sexe=sexe,

            date_naissance=datetime.date(
                random.randint(1970, 2005),
                random.randint(1, 12),
                random.randint(1, 28)
            ),

            lieu_naissance=random.choice(["Kinshasa", "Lubumbashi", "Goma", "Kisangani"]),
            etat_civil=random.choice(etats_civils),
            nombre_enfants=random.randint(0, 6),

            profession=random.choice(professions),
            adresse_residence=random.choice(["Kinshasa", "Matadi", "Lubumbashi"]),

            nom_pere="Inconnu" if random.random() < 0.25 else random.choice(noms),
            nom_mere=random.choice(noms),

            taille=random.randint(155, 190),
            teint=random.choice(["Clair", "Sombre", "Brun"]),
            pointure=random.randint(38, 46),

            signes_particuliers=random.choice([
                "Aucun",
                "Cicatrice bras gauche",
                "Tatouage épaule",
                "Cicatrice visage",
                "Brûlure légère main"
            ]),

            contact_urgence_nom="Contact famille",
            contact_urgence_tel=f"+24397{random.randint(1000000, 9999999)}",
            lien_parente=random.choice(liens_parente),

            prison=random.choice(prisons),

            statut_juridique=random.choice([
                'PREVENU',
                'DETENU_PREVENTIF',
                'CONDAMNE'
            ]),

            autorite_judiciaire=random.choice(infractions),

            solde=round(random.uniform(0, 500), 2),

            regime_alimentaire=random.choice(["Normal", "Diabétique", "Végétarien"]),

            pavillon_actuel=f"PAV-{random.randint(1,5)}",
            cellule_actuelle=f"CELL-{random.randint(1,50)}",

            etat="PRÉSENT",

            est_dangereux=random.choice([True, False])
        )

        print(f"✅ Détenu {i+1}/50 créé : {detenu.nom} {detenu.postnom} {detenu.prenom}")



if __name__ == "__main__":
    print("🚀 Seeding de 50 détenus en cours...")
    seed_detenus()
    print("✅ Terminé avec succès !")