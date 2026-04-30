import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prison_biometrie.settings')
django.setup()

from core.models import Prison, Ville, Province 

def seed_data():
    print("--- Début du remplissage National avec Géo-localisation (RDC) ---")

    # Ajout des coordonnées (lat, lng) pour chaque entrée
    data_complet = [
        # KINSHASA
        {"prov": "Kinshasa", "ville": "Kinshasa", "nom": "CPRK (Makala)", "code": "KIN-MAK", "cap": 1500, "lat": -4.325, "lng": 15.322},
        {"prov": "Kinshasa", "ville": "Kinshasa", "nom": "Prison Militaire de Ndolo", "code": "KIN-NDL", "cap": 500, "lat": -4.316, "lng": 15.333},
        
        # NORD-KIVU
        {"prov": "Nord-Kivu", "ville": "Goma", "nom": "Prison Centrale de Munzenze", "code": "NK-MUN", "cap": 1000, "lat": -1.679, "lng": 29.228},
        {"prov": "Nord-Kivu", "ville": "Beni", "nom": "Prison Centrale de Beni", "code": "NK-BEN", "cap": 400, "lat": 0.491, "lng": 29.473},
        {"prov": "Nord-Kivu", "ville": "Butembo", "nom": "Prison Centrale de Butembo", "code": "NK-BUT", "cap": 350, "lat": 0.129, "lng": 29.284},
        
        # SUD-KIVU
        {"prov": "Sud-Kivu", "ville": "Bukavu", "nom": "Prison Centrale de Bukavu", "code": "SK-BUK", "cap": 800, "lat": -2.503, "lng": 28.861},
        {"prov": "Sud-Kivu", "ville": "Uvira", "nom": "Prison Centrale d'Uvira", "code": "SK-UVI", "cap": 400, "lat": -3.406, "lng": 29.145},
        
        # HAUT-KATANGA & LUALABA
        {"prov": "Haut-Katanga", "ville": "Lubumbashi", "nom": "Prison Centrale de Kasapa", "code": "HK-KAS", "cap": 2000, "lat": -11.603, "lng": 27.452},
        {"prov": "Haut-Katanga", "ville": "Likasi", "nom": "Prison de Buluo", "code": "HK-BUL", "cap": 600, "lat": -10.975, "lng": 26.736},
        {"prov": "Lualaba", "ville": "Kolwezi", "nom": "Prison Centrale de Kolwezi", "code": "LUA-KOL", "cap": 600, "lat": -10.715, "lng": 25.473},
        
        # KONGO CENTRAL
        {"prov": "Kongo Central", "ville": "Matadi", "nom": "Prison de Matadi", "code": "KC-MAT", "cap": 500, "lat": -5.826, "lng": 13.454},
        {"prov": "Kongo Central", "ville": "Boma", "nom": "Prison de Boma", "code": "KC-BOM", "cap": 400, "lat": -5.850, "lng": 13.050},
        
        # ESPACE GRAND KASAI
        {"prov": "Kasaï-Oriental", "ville": "Mbuji-Mayi", "nom": "Prison Centrale de Mbuji-Mayi", "code": "KOR-MBU", "cap": 700, "lat": -6.137, "lng": 23.606},
        {"prov": "Kasaï-Central", "ville": "Kananga", "nom": "Prison Centrale de Kananga", "code": "KCA-KAN", "cap": 800, "lat": -5.896, "lng": 22.416},
        {"prov": "Kasaï", "ville": "Tshikapa", "nom": "Prison Centrale de Tshikapa", "code": "KAS-TSH", "cap": 500, "lat": -6.416, "lng": 20.783},
        
        # ORIENTALE (TSHOPO, ITURI)
        {"prov": "Tshopo", "ville": "Kisangani", "nom": "Prison Centrale de Kisangani", "code": "TSH-KIS", "cap": 1000, "lat": 0.516, "lng": 25.200},
        {"prov": "Ituri", "ville": "Bunia", "nom": "Prison Centrale de Bunia", "code": "ITU-BUN", "cap": 600, "lat": 1.563, "lng": 30.252},
        
        # GRAND BANDUNDU
        {"prov": "Kwilu", "ville": "Kikwit", "nom": "Prison Centrale de Kikwit", "code": "KWL-KIK", "cap": 600, "lat": -5.041, "lng": 18.816},
        {"prov": "Kwilu", "ville": "Bandundu", "nom": "Prison Centrale de Bandundu-Ville", "code": "KWL-BAN", "cap": 450, "lat": -3.316, "lng": 17.383},
        {"prov": "Kwango", "ville": "Kenge", "nom": "Prison Centrale de Kenge", "code": "KWA-KEN", "cap": 300, "lat": -4.851, "lng": 17.038},
        
        # ÉQUATEUR & MANIEMA
        {"prov": "Équateur", "ville": "Mbandaka", "nom": "Prison Centrale de Mbandaka", "code": "EQ-MBA", "cap": 500, "lat": 0.048, "lng": 18.260},
        {"prov": "Maniema", "ville": "Kindu", "nom": "Prison Centrale de Kindu", "code": "MAN-KIN", "cap": 450, "lat": -2.946, "lng": 25.922},
    ]

    for item in data_complet:
        # 1. Gérer la Province
        province_obj, _ = Province.objects.get_or_create(nom=item['prov'])
        
        # 2. Gérer la Ville
        ville_obj, _ = Ville.objects.get_or_create(
            nom=item['ville'],
            province=province_obj
        )
        
        # 3. Gérer la Prison (Update or Create)
        prison, created = Prison.objects.update_or_create(
            code=item['code'],
            defaults={
                'nom': item['nom'],
                'ville': ville_obj,
                'capacite': item['cap'],
                'latitude': item['lat'],
                'longitude': item['lng'],
                'adresse': f"Ville de {item['ville']}, Province de {item['prov']}",
                'directeur': "Cadre Pénitentiaire à désigner"
            }
        )

        if created:
            print(f"✅ Ajoutée : {item['nom']} à {item['lat']}, {item['lng']}")
        else:
            print(f"🔄 Mise à jour (Géo) : {item['nom']}")

    print(f"--- Opération terminée : {len(data_complet)} établissements localisés ---")

if __name__ == "__main__":
    seed_data()