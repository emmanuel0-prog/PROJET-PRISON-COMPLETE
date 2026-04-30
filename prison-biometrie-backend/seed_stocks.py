import os
import django
import random
from datetime import datetime, timedelta

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings') # <--- REMPLACE PAR LE NOM DE TON PROJET
django.setup()

from core.models import Article, MouvementStock # <--- REMPLACE PAR LE NOM DE TON APP


def run_seed():
    print("--- DÉMARRAGE DU SEEDING DES STOCKS ---")
    
    # 1. Nettoyage (Optionnel)
    # MouvementStock.objects.all().delete()
    # Article.objects.all().delete()

    # 2. Création des Articles
    articles_data = [
        {"nom": "Riz Long Grain (Sac 50kg)", "cat": "Alimentation", "unite": "Sacs", "seuil": 20, "prix": 45.00},
        {"nom": "Haricots Jaunes (Sac 50kg)", "cat": "Alimentation", "unite": "Sacs", "seuil": 15, "prix": 60.00},
        {"nom": "Huile Végétale (Bidon 20L)", "cat": "Alimentation", "unite": "Bidons", "seuil": 10, "prix": 35.00},
        {"nom": "Sel Iodé (Carton 20kg)", "cat": "Alimentation", "unite": "Cartons", "seuil": 5, "prix": 12.00},
        {"nom": "Paracétamol 500mg", "cat": "Médical", "unite": "Boîtes", "seuil": 50, "prix": 5.50},
        {"nom": "Amoxicilline (Antibiotique)", "cat": "Médical", "unite": "Boîtes", "seuil": 30, "prix": 15.00},
        {"nom": "Uniformes Détenus (Orange)", "cat": "Équipement", "unite": "Unités", "seuil": 100, "prix": 18.00},
        {"nom": "Matelas Mousse Haute Densité", "cat": "Équipement", "unite": "Unités", "seuil": 20, "prix": 25.00},
        {"nom": "Savon de Marseille (Caisse)", "cat": "Entretien", "unite": "Caisses", "seuil": 15, "prix": 22.00},
        {"nom": "Chlore / Désinfectant (20L)", "cat": "Entretien", "unite": "Bidons", "seuil": 8, "prix": 40.00},
    ]

    

    for item in articles_data:
        article, created = Article.objects.get_or_create(
            nom=item['nom'],
            defaults={
                'categorie': item['cat'],
                'unite': item['unite'],
                'seuil_alerte': item['seuil'],
                'valeur_unitaire': item['prix'],
                'quantite': random.randint(5, 10) # On commence avec un petit stock
            }
        )
        
        # 3. Génération d'un Historique sur 30 jours
        print(f"Génération des mouvements pour : {article.nom}")
        
        for i in range(30, 0, -1):
            date_mvt = datetime.now() - timedelta(days=i)
            
            # Simulation d'une entrée (Livraison hebdomadaire par exemple)
            if i % 7 == 0:
                qte_entree = random.randint(50, 100)
                MouvementStock.objects.create(
                    article=article,
                    type_mouvement="ENTRÉE",
                    quantite=qte_entree,
                    motif="Livraison fournisseur officielle",
                    
                )
                article.quantite += qte_entree
            
            # Simulation de sorties quotidiennes aléatoires
            if random.choice([True, False]): # 50% de chance qu'il y ait une sortie ce jour-là
                qte_sortie = random.randint(2, 12)
                if article.quantite >= qte_sortie:
                    MouvementStock.objects.create(
                        article=article,
                        type_mouvement="SORTIE",
                        quantite=qte_sortie,
                        motif=f"Distribution Pavillon {random.choice(['A', 'B', 'C', 'D'])}",
                        
                    )
                    article.quantite -= qte_sortie
        
        article.save()

    print("--- SEEDING TERMINÉ AVEC SUCCÈS ---")

if __name__ == "__main__":
    run_seed()