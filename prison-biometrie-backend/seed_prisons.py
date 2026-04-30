import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from core.models import Prison, Ville, Province 

def seed_data():
    print("--- Début du remplissage National (RDC) ---")

    data_complet = [
        # KINSHASA
        {"prov": "Kinshasa", "ville": "Kinshasa", "nom": "CPRK (Makala)", "code": "KIN-MAK", "cap": 1500},
        {"prov": "Kinshasa", "ville": "Kinshasa", "nom": "Prison Militaire de Ndolo", "code": "KIN-NDL", "cap": 500},
        
        # NORD-KIVU
        {"prov": "Nord-Kivu", "ville": "Goma", "nom": "Prison Centrale de Munzenze", "code": "NK-MUN", "cap": 1000},
        {"prov": "Nord-Kivu", "ville": "Beni", "nom": "Prison Centrale de Beni", "code": "NK-BEN", "cap": 400},
        {"prov": "Nord-Kivu", "ville": "Butembo", "nom": "Prison Centrale de Butembo", "code": "NK-BUT", "cap": 350},
        
        # SUD-KIVU
        {"prov": "Sud-Kivu", "ville": "Bukavu", "nom": "Prison Centrale de Bukavu", "code": "SK-BUK", "cap": 800},
        {"prov": "Sud-Kivu", "ville": "Uvira", "nom": "Prison Centrale d'Uvira", "code": "SK-UVI", "cap": 400},
        
        # HAUT-KATANGA & LUALABA
        {"prov": "Haut-Katanga", "ville": "Lubumbashi", "nom": "Prison Centrale de Kasapa", "code": "HK-KAS", "cap": 2000},
        {"prov": "Haut-Katanga", "ville": "Likasi", "nom": "Prison de Buluo", "code": "HK-BUL", "cap": 600},
        {"prov": "Lualaba", "ville": "Kolwezi", "nom": "Prison Centrale de Kolwezi", "code": "LUA-KOL", "cap": 600},
        
        # KONGO CENTRAL
        {"prov": "Kongo Central", "ville": "Matadi", "nom": "Prison de Matadi", "code": "KC-MAT", "cap": 500},
        {"prov": "Kongo Central", "ville": "Boma", "nom": "Prison de Boma", "code": "KC-BOM", "cap": 400},
        
        # ESPACE GRAND KASAI
        {"prov": "Kasaï-Oriental", "ville": "Mbuji-Mayi", "nom": "Prison Centrale de Mbuji-Mayi", "code": "KOR-MBU", "cap": 700},
        {"prov": "Kasaï-Central", "ville": "Kananga", "nom": "Prison Centrale de Kananga", "code": "KCA-KAN", "cap": 800},
        {"prov": "Kasaï", "ville": "Tshikapa", "nom": "Prison Centrale de Tshikapa", "code": "KAS-TSH", "cap": 500},
        
        # ORIENTALE (TSHOPO, ITURI)
        {"prov": "Tshopo", "ville": "Kisangani", "nom": "Prison Centrale de Kisangani", "code": "TSH-KIS", "cap": 1000},
        {"prov": "Ituri", "ville": "Bunia", "nom": "Prison Centrale de Bunia", "code": "ITU-BUN", "cap": 600},
        
        # GRAND BANDUNDU
        {"prov": "Kwilu", "ville": "Kikwit", "nom": "Prison Centrale de Kikwit", "code": "KWL-KIK", "cap": 600},
        {"prov": "Kwilu", "ville": "Bandundu", "nom": "Prison Centrale de Bandundu-Ville", "code": "KWL-BAN", "cap": 450},
        {"prov": "Kwango", "ville": "Kenge", "nom": "Prison Centrale de Kenge", "code": "KWA-KEN", "cap": 300},
        
        # ÉQUATEUR & MANIEMA
        {"prov": "Équateur", "ville": "Mbandaka", "nom": "Prison Centrale de Mbandaka", "code": "EQ-MBA", "cap": 500},
        {"prov": "Maniema", "ville": "Kindu", "nom": "Prison Centrale de Kindu", "code": "MAN-KIN", "cap": 450},
    ]

    for item in data_complet:
        # 1. Gérer la Province
        province_obj, _ = Province.objects.get_or_create(nom=item['prov'])
        
        # 2. Gérer la Ville
        ville_obj, _ = Ville.objects.get_or_create(
            nom=item['ville'],
            defaults={'province': province_obj}
        )
        
        # 3. Gérer la Prison
        prison, created = Prison.objects.get_or_create(
            code=item['code'],
            defaults={
                'nom': item['nom'],
                'ville': ville_obj,
                'capacite': item['cap'],
                'adresse': f"Ville de {item['ville']}, Province de {item['prov']}",
                'directeur': "Cadre Pénitentiaire à désigner"
            }
        )

        if created:
            print(f"✅ Ajoutée : {item['nom']} ({item['prov']})")
        else:
            print(f"ℹ️ Mise à jour/Déjà là : {item['nom']}")

    print("--- Opération terminée : 22 établissements référencés ---")

if __name__ == "__main__":
    seed_data()