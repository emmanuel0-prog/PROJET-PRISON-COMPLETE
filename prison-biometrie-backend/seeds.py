import os
import django
import random
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from core.models import (
    Agent, Pointage, Article, MouvementStock,
    Planning, Absence
)

# ==========================
# RESET OPTIONNEL (TRÈS IMPORTANT)
# ==========================
def clear_data():
    Pointage.objects.all().delete()
    Planning.objects.all().delete()
    Absence.objects.all().delete()
    Article.objects.all().delete()
    Agent.objects.all().delete()


# ==========================
# DATA
# ==========================

noms = ["MUTOMBO", "KALENGA", "MBOKO", "LUKUSA", "BAYOKA", "KAFUTA"]
postnoms = ["NGOMA", "KABONGO", "MUKUNA", "KALONDA"]
prenoms = ["Jean", "Paul", "David", "Patrick", "Junior"]

secteurs = ['SECURITE', 'LOGISTIQUE', 'ADMIN', 'MEDICAL']
grades = ["Agent", "Chef de poste", "Inspecteur"]

articles_data = [
    ("Riz", "Alimentation"),
    ("Haricot", "Alimentation"),
    ("Paracétamol", "Médical"),
]


# ==========================
# 1. AGENTS (FIX UNIQUE)
# ==========================

def seed_agents():
    agents = []

    for i in range(20):

        matricule = f"AG-{random.randint(1000,9999)}"
        nni = f"NNI{random.randint(100000,999999)}"

        agent, created = Agent.objects.get_or_create(
            matricule=matricule,
            defaults={
                "nni": nni,
                "nom": random.choice(noms),
                "postnom": random.choice(postnoms),
                "prenom": random.choice(prenoms),

                "sexe": random.choice(['M', 'F']),
                "date_naissance": datetime.date(
                    random.randint(1970, 2000),
                    random.randint(1, 12),
                    random.randint(1, 28)
                ),

                "lieu_naissance": "Kinshasa",
                "grade": random.choice(grades),
                "echelon": "E1",

                "date_prise_fonction": datetime.date(2020, 1, 1),

                "telephone": f"+24397{random.randint(1000000,9999999)}",
                "email_professionnel": f"agent{i}{random.randint(1,999)}@prison.gov",

                "adresse_residence": "Kinshasa",
                "contact_urgence_nom": "Famille",
                "contact_urgence_tel": f"+24398{random.randint(1000000,9999999)}",

                "statut": random.choice(['EN POSTE', 'MISSION']),
                "secteur": random.choice(secteurs),
                "affectation": f"PAV-{random.randint(1,5)}",
                "est_actif": True
            }
        )

        agents.append(agent)
        print(f"✅ Agent : {agent.nom} {agent.postnom}")

    return agents


# ==========================
# 2. POINTAGES (FIX UNIQUE)
# ==========================

def seed_pointage(agents):

    for agent in agents:
        for i in range(3):

            date_jour = datetime.date.today() - datetime.timedelta(days=i)

            Pointage.objects.get_or_create(
                agent=agent,
                date_jour=date_jour,
                defaults={
                    "heure_arrivee": datetime.time(
                        random.randint(6, 9),
                        random.randint(0, 59)
                    ),
                    "statut": random.choice(['PRÉSENT', 'RETARD']),
                    "methode": "BIOMÉTRIQUE"
                }
            )

    print("✅ Pointages OK")


# ==========================
# 3. ARTICLES
# ==========================

def seed_articles():
    for nom, cat in articles_data:

        Article.objects.get_or_create(
            nom=nom,
            defaults={
                "categorie": cat,
                "quantite": random.randint(10, 200),
                "unite": "kg",
                "seuil_alerte": 10,
                "valeur_unitaire": round(random.uniform(1, 50), 2)
            }
        )

    print("📦 Articles OK")


# ==========================
# 4. PLANNING
# ==========================

def seed_planning(agents):
    for agent in agents:
        for i in range(2):

            Planning.objects.get_or_create(
                agent=agent,
                date=datetime.date.today() + datetime.timedelta(days=i),
                vacation=random.choice(['MATIN', 'APRES_MIDI', 'NUIT']),
                defaults={
                    "secteur_affecte": random.choice(secteurs),
                    "est_present": random.choice([True, False])
                }
            )

    print("📅 Planning OK")


# ==========================
# 5. ABSENCES
# ==========================

def seed_absences(agents):
    for i in range(10):

        agent = random.choice(agents)

        Absence.objects.create(
            agent=agent,
            type_absence=random.choice(['CONGÉ', 'MISSION', 'MALADIE']),
            date_debut=datetime.date.today(),
            date_fin=datetime.date.today() + datetime.timedelta(days=3),
            motif="Motif administratif",
            statut=random.choice(['EN_ATTENTE', 'APPROUVÉ'])
        )

    print("🚫 Absences OK")


# ==========================
# RUN
# ==========================

def run():
    print("🚀 SEED GLOBAL...")

    # ⚠️ optionnel (décommente si tu veux reset total)
    # clear_data()

    agents = seed_agents()
    seed_pointage(agents)
    seed_articles()
    seed_planning(agents)
    seed_absences(agents)

    print("🎉 TERMINÉ !")


if __name__ == "__main__":
    run()