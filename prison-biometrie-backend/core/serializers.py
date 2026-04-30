from rest_framework import serializers
from drf_extra_fields.fields import Base64ImageField 
from .models import Detenu, Prison, DossierJudiciaire,HistoriqueMouvement,TraceurAudit,  Parquet, DocumentEcrouHistory, Tribunal,BiometrieDetenu, Visiteur, Cellule, AffectationCellule, MouvementExterieur, Consultation, StockMedicament, ArticleCantine, TransactionCantine
import datetime

from .models import Deces




from rest_framework import serializers
from .models import Detenu, DossierJudiciaire, DocumentEcrou, Parquet





class ParquetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parquet
        fields = '__all__'


class ParquetSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parquet
        fields = ['id', 'nom', 'ville'] # Juste le nécessaire pour React


class ConsultationHistoriqueSerializer(serializers.ModelSerializer):
    # On formate la date directement ici pour faciliter le travail de React
    date_creation = serializers.DateTimeField(format="%d/%m/%Y à %H:%M")

    class Meta:
        model = Consultation
        # On utilise bien 'date_creation' (le nom dans ton modèle)
        fields = ['id', 'date_creation', 'motif', 'observations', 'priorite', 'statut', 'prescription']
        read_only_fields = ['date_creation']

        
class ConsultationSerializer(serializers.ModelSerializer):
    # Infos du détenu
    nom = serializers.ReadOnlyField(source='detenu.nom')
    prenom = serializers.ReadOnlyField(source='detenu.prenom')
    matricule = serializers.ReadOnlyField(source='detenu.matricule') # Très utile pour les PDF officiels
    cellule = serializers.ReadOnlyField(source='detenu.cellule_actuelle')
    pavillon = serializers.ReadOnlyField(source='detenu.pavillon_actuel') # Recommandé pour le tri
    
    # Formatage temporel
    # On garde 'heure' pour l'affichage rapide et 'date_creation' pour le tri DataGrid
    heure = serializers.DateTimeField(source='date_creation', format="%H:%M", read_only=True)
    date_creation = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S", read_only=True)

    class Meta:
        model = Consultation
        fields = [
            'id', 'detenu', 'nom', 'prenom', 'matricule', 'cellule', 'pavillon',
            'motif', 'priorite', 'statut', 'heure', 'date_creation', 
            'observations', 'prescription'  # <--- N'oublie pas la prescription ici !
        ]
class StockMedicamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMedicament
        fields = '__all__'

# Serializer spécifique pour les statistiques du dashboard médical
class MedicalStatsSerializer(serializers.Serializer):
    total_jour = serializers.IntegerField()
    traites_jour = serializers.IntegerField()
    pourcentage = serializers.FloatField()


class DetenuPresenceSerializer(serializers.ModelSerializer):
    # Optionnel : On crée un champ calculé pour afficher le nom complet dans React
    nom_complet = serializers.SerializerMethodField()
    # On fait correspondre 'cellule' au champ 'cellule_actuelle' du modèle
    cellule = serializers.CharField(source='cellule_actuelle')

    class Meta:
        model = Detenu
        fields = ['id', 'matricule', 'nom_complet', 'nom', 'cellule', 'etat']

    def get_nom_complet(self, obj):
        return f"{obj.nom} {obj.prenom}"
    

class PrisonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prison
        fields = '__all__'


# --- 1. DOSSIER JUDICIAIRE ---
class DossierJudiciaireSerializer(serializers.ModelSerializer):
    parquet_nom = serializers.ReadOnlyField(source='parquet_origine.nom')

    class Meta:
        model = DossierJudiciaire
        fields = [
            'id', 'detenu', 'numero_rmp', 'numero_rp', 'parquet_origine', 
            'parquet_nom', 'tribunal_saisi', 'magistrat_instructeur', 
            'chef_inculpation', 'peine_prononcee', 'date_faits', 
            'date_jugement', 'date_expiration_peine'
        ]
class DocumentEcrouHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentEcrouHistory
        fields = '__all__'
# --- 2. DOCUMENTS D'ÉCROU (Les scans PDF/Images) ---
from django.utils import timezone
from rest_framework import serializers



from rest_framework import serializers
from django.utils import timezone
from .models import DocumentEcrou

class DocumentEcrouSerializer(serializers.ModelSerializer):
    # Récupération des labels et noms liés
    type_label = serializers.CharField(source='get_type_document_display', read_only=True)
    parquet_nom = serializers.ReadOnlyField(source='parquet_emetteur.nom')
    detenu_nom_complet = serializers.SerializerMethodField()
    detenu_matricule = serializers.ReadOnlyField(source='detenu.matricule')
    
    # Champs calculés pour les alertes React
    est_expire = serializers.SerializerMethodField()
    temps_restant_info = serializers.SerializerMethodField()

    class Meta:
        model = DocumentEcrou
        fields = [
            'id', 'detenu', 'detenu_nom_complet', 'detenu_matricule',
            'type_document', 'type_label', 'numero_document', 
            'parquet_emetteur', 'parquet_nom', 'date_emission', 
            'date_expiration', 'fichier_scanne', 'est_expire', 'temps_restant_info'
        ]

    def get_detenu_nom_complet(self, obj):
        if obj.detenu:
            return f"{obj.detenu.nom} {obj.detenu.postnom} {obj.detenu.prenom}".upper()
        return "INCONNU"

    def get_est_expire(self, obj):
        if obj.date_expiration:
            # CORRECTION : Comparaison Date vs Date pour éviter l'erreur 500
            return obj.date_expiration < timezone.now().date()
        return False

    def get_temps_restant_info(self, obj):
        """Renvoie les infos de délai pour l'affichage des badges React"""
        if obj.date_expiration:
            # CORRECTION : Utilisation de .date() pour la soustraction
            aujourdhui = timezone.now().date()
            delta = obj.date_expiration - aujourdhui
            
            return {
                "expire": delta.days < 0,
                "jours": delta.days,
                "total_heures": delta.days * 24,
                "message": f"{delta.days} jours restants" if delta.days >= 0 else "Expiré"
            }
        return None

    def validate_date_emission(self, value):
        """Empêcher les dates futures"""
        if value > timezone.now().date():
            raise serializers.ValidationError("La date d'émission ne peut pas être dans le futur.")
        return value
    
from rest_framework import serializers
from .models import Detenu, Prison, Parquet, DossierJudiciaire, DocumentEcrou
import drf_extra_fields.fields as extra_fields

# Si tu utilises drf-extra-fields pour la photo webcam
class Base64ImageField(extra_fields.Base64ImageField):
    pass


from django.conf import settings
from rest_framework import serializers
from .models import Detenu, DossierJudiciaire, Parquet, JournalActivite

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')

from rest_framework import serializers
from .models import Detenu, DossierJudiciaire, Parquet, JournalActivite, Prison


# Si tu n'utilises pas drf_extra_fields, assure-toi que Base64ImageField est défini
# Sinon remplace par serializers.ImageField()
from drf_extra_fields.fields import Base64ImageField 

class DetenuSerializer(serializers.ModelSerializer):
    photo = Base64ImageField(required=False, allow_null=True)
    dossier_judiciaire = serializers.SerializerMethodField() # Utilisation d'un getter pour plus de flexibilité
    
    # --- CHAMPS POUR L'AFFICHAGE (READ ONLY) ---
    nom_complet = serializers.SerializerMethodField()
    prison_nom = serializers.CharField(source='prison.nom', read_only=True)
    statut_juridique_label = serializers.CharField(source='get_statut_juridique_display', read_only=True)
    nb_modifications = serializers.SerializerMethodField()

    class Meta:
        model = Detenu
        fields = '__all__'
        # matricule est souvent généré automatiquement dans le modèle save()
        read_only_fields = ['matricule', 'solde', 'date_entree', 'est_supprime', 'date_suppression']

    def get_nom_complet(self, obj):
        return f"{obj.nom} {obj.postnom} {obj.prenom}".upper()

    def get_nb_modifications(self, obj):
        # On utilise le related_name 'historique' défini dans ton modèle JournalActivite
        return obj.historique.filter(action='EDITION').count()
    
    def get_dossier_judiciaire(self, obj):
        # Récupère le dossier lié s'il existe
        from .serializers import DossierJudiciaireSerializer # Import local pour éviter les imports circulaires
        dossier = getattr(obj, 'dossier_judiciaire', None)
        if dossier:
            return DossierJudiciaireSerializer(dossier).data
        return None

    # --- LOGIQUE DE CRÉATION + SÉCURITÉ PRISON ---
    def create(self, validated_data):
        request = self.context.get('request')
        request_data = request.data
        
        # SÉCURITÉ : Empêcher le crash si la prison est manquante
        if 'prison' not in validated_data:
            default_prison = Prison.objects.first()
            if not default_prison:
                raise serializers.ValidationError({"prison": "Aucune prison configurée dans le système."})
            validated_data['prison'] = default_prison

        # 1. Création du détenu
        detenu = Detenu.objects.create(**validated_data)

        # 2. Création du Dossier Judiciaire
        parquet_id = request_data.get('parquet_origine')
        parquet_obj = Parquet.objects.filter(id=parquet_id).first() if parquet_id else None

        DossierJudiciaire.objects.create(
            detenu=detenu,
            numero_rmp=request_data.get('numero_rmp', ""),
            parquet_origine=parquet_obj,
            chef_inculpation=request_data.get('chef_inculpation', "Non spécifié"),
            peine_prononcee=request_data.get('peine_prononcee', ""),
            tribunal_saisi=request_data.get('tribunal_saisi', "En attente")
        )

        # 3. Journalisation
        JournalActivite.objects.create(
            detenu=detenu,
            action='CREATION',
            description="Ouverture du dossier et premier écrou.",
            utilisateur=request.user if request.user.is_authenticated else None,
            adresse_ip=get_client_ip(request)
        )

        return detenu

    # --- LOGIQUE DE MISE À JOUR ---
    def update(self, instance, validated_data):
        request = self.context.get('request')
        request_data = request.data
        ancien_statut = instance.statut_juridique

        # 1. Mise à jour Detenu
        instance = super().update(instance, validated_data)

        # 2. Mise à jour Dossier Judiciaire (get_or_create pour éviter les crashs)
        dossier, _ = DossierJudiciaire.objects.get_or_create(detenu=instance)
        dossier.numero_rmp = request_data.get('numero_rmp', dossier.numero_rmp)
        dossier.chef_inculpation = request_data.get('chef_inculpation', dossier.chef_inculpation)
        dossier.peine_prononcee = request_data.get('peine_prononcee', dossier.peine_prononcee)
        
        parquet_id = request_data.get('parquet_origine')
        if parquet_id:
            dossier.parquet_origine_id = parquet_id
        dossier.save()

        # 3. Journalisation
        msg = "Mise à jour du dossier."
        if ancien_statut != instance.statut_juridique:
            msg += f" Statut changé: {ancien_statut} -> {instance.statut_juridique}"

        JournalActivite.objects.create(
            detenu=instance,
            action='EDITION',
            description=msg,
            utilisateur=request.user if request.user.is_authenticated else None,
            adresse_ip=get_client_ip(request)
        )

        return instance
    




from rest_framework import serializers
from .models import Pavillon, Cellule, AffectationCellule
from django.core.exceptions import ValidationError

class PavillonSerializer(serializers.ModelSerializer):
    type_zone_label = serializers.CharField(source='get_type_zone_display', read_only=True)

    class Meta:
        model = Pavillon
        fields = ['id', 'nom', 'type_zone', 'type_zone_label', 'description', 'is_deleted']

from .models import Pavillon, PavillonHistory

class PavillonHistorySerializer(serializers.ModelSerializer):
    modifie_par_nom = serializers.ReadOnlyField(source='modifie_par.username')
    
    class Meta:
        model = PavillonHistory
        fields = '__all__'

class CelluleSerializer(serializers.ModelSerializer):
    pavillon_nom = serializers.ReadOnlyField(source='pavillon.nom')
    occupation = serializers.ReadOnlyField(source='occupation_actuelle')
    est_pleine = serializers.ReadOnlyField()

    class Meta:
        model = Cellule
        fields = ['id', 'pavillon', 'pavillon_nom', 'numero', 'capacite_max', 'occupation', 'est_pleine']

from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import AffectationCellule, Detenu, Cellule

from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import AffectationCellule, Detenu, Cellule
from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import AffectationCellule

from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import AffectationCellule, AffectationCelluleHistory



class AffectationCelluleSerializer(serializers.ModelSerializer):
    detenu_nom = serializers.ReadOnlyField(source='detenu.nom')
    cellule_numero = serializers.ReadOnlyField(source='cellule.numero')
    pavillon_nom = serializers.ReadOnlyField(source='cellule.pavillon.nom')

    # Conservation de votre formatage de date personnalisé
    date_entree = serializers.DateTimeField(
        allow_null=True, required=False, default=None,
        style={'input_type': 'text', 'placeholder': 'YYYY-MM-DD HH:MM:SS'}
    )
    date_sortie = serializers.DateTimeField(
        allow_null=True, required=False, default=None,
        style={'input_type': 'text', 'placeholder': 'YYYY-MM-DD HH:MM:SS'}
    )

    class Meta:
        model = AffectationCellule
        fields = [
            'id', 'detenu', 'detenu_nom', 'cellule', 'cellule_numero', 
            'pavillon_nom', 'date_entree', 'date_sortie', 
            'motif_affectation', 'is_deleted'
        ]

    def validate(self, data):
        """Votre logique de validation par le modèle (Clean)"""
        instance = getattr(self, 'instance', None)
        try:
            # Récupération des champs réels du modèle pour l'instance de test
            model_fields = [f.name for f in AffectationCellule._meta.get_fields()]
            clean_data = {k: v for k, v in data.items() if k in model_fields}
            
            test_instance = AffectationCellule(**clean_data)
            if instance:
                test_instance.pk = instance.pk
            
            # Appel de la validation métier (capacité, sécurité RDC)
            test_instance.clean()
        except ValidationError as e:
            raise serializers.ValidationError(
                e.message_dict if hasattr(e, 'message_dict') else e.message
            )
        return data

class AffectationCelluleHistorySerializer(serializers.ModelSerializer):
    """Pour afficher les logs 'Ancien vs Nouveau' dans React"""
    modifie_par_nom = serializers.ReadOnlyField(source='modifie_par.username')
    
    class Meta:
        model = AffectationCelluleHistory
        fields = ['id', 'date_modification', 'modifie_par_nom', 'etat_ancien', 'etat_actuel', 'action']

class TribunalSerializer(serializers.ModelSerializer):
    # On ajoute explicitement les nouveaux champs ici
    class Meta:
        model = Tribunal
        fields = ['id', 'nom', 'type_juridiction', 'ville', 'commune', 'adresse']

from rest_framework import serializers
from .models import MouvementExterieur, Tribunal



class MouvementExterieurSerializer(serializers.ModelSerializer):
    # --- CHAMPS EN LECTURE (Pour l'affichage dans la DataGrid) ---
    nom_detenu = serializers.ReadOnlyField(source='detenu.nom')
    postnom_detenu = serializers.ReadOnlyField(source='detenu.postnom')
    prenom_detenu = serializers.ReadOnlyField(source='detenu.prenom')
    matricule_detenu = serializers.ReadOnlyField(source='detenu.matricule')
    photo_detenu = serializers.SerializerMethodField()
    
    tribunal_details = TribunalSerializer(source='tribunal', read_only=True)
    
    # --- CHAMPS EN ÉCRITURE (Mapping pour la compatibilité React) ---
    # Ces champs permettent de recevoir 'num_document' et de l'enregistrer dans 'num_reference_acte'
    num_document = serializers.CharField(source='num_reference_acte', write_only=True, required=False)
    type_document = serializers.CharField(source='type_acte', write_only=True, required=False)
    motif = serializers.CharField(source='motif_details', write_only=True, required=False)

    class Meta:
        model = MouvementExterieur
        fields = [
            'id', 'detenu', 'nom_detenu', 'postnom_detenu', 'prenom_detenu', 
            'matricule_detenu', 'photo_detenu', 'destination', 
            'tribunal', 'tribunal_details', 'type_acte', 'num_reference_acte', 
            'motif_details', 'escorte', 'mandat_verifie', 
            'ordre_mission_verifie', 'heure_sortie', 'heure_retour', 'statut',
            # Nouveaux champs pour matcher le JSON du frontend
            'num_document', 'type_document', 'motif'
        ]

    def get_photo_detenu(self, obj):
        """Construit l'URL absolue pour la photo du détenu"""
        request = self.context.get('request')
        if obj.detenu.photo:
            try:
                # Si la requête est présente, on construit l'URL complète
                if request:
                    return request.build_absolute_uri(obj.detenu.photo.url)
                # Sinon on retourne juste l'URL relative
                return obj.detenu.photo.url
            except Exception:
                return None
        return None

    def validate(self, data):
        """Validation personnalisée : Juridiction obligatoire si destination Tribunal"""
        destination = data.get('destination')
        tribunal = data.get('tribunal')
        
        if destination == 'TRIBUNAL' and not tribunal:
            raise serializers.ValidationError({
                "tribunal": "La juridiction est obligatoire pour une sortie vers le tribunal."
            })
        return data


class HistoriqueMouvementSerializer(serializers.ModelSerializer):
    modifie_par_nom = serializers.ReadOnlyField(source='modifie_par.get_full_name')

    class Meta:
        model = HistoriqueMouvement
        fields = ['action', 'date_modification', 'modifie_par_nom', 'etat_ancien', 'etat_actuel']


class DashboardStatsSerializer(serializers.Serializer):
    total_detenus = serializers.IntegerField()
    prevenus = serializers.IntegerField()
    condamnes = serializers.IntegerField()
    taux_biometrique = serializers.FloatField()
    # On peut ajouter des listes pour les graphiques
    evolution_flux = serializers.ListField()





class ArticleCantineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleCantine
        fields = ['id', 'nom', 'prix', 'stock', 'disponible']

class DetenuCantineSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = Detenu
        fields = [
            'id', 
            'nom', 
            'postnom', # Ajouté pour correspondre au modèle
            'prenom', 
            'nom_complet', 
            'matricule',
            'solde',      # INDISPENSABLE pour la cantine
            'regime',     # INDISPENSABLE pour la sécurité médicale
            'pavillon_actuel', 
            'cellule_actuelle'
        ]

    def get_nom_complet(self, obj):
        # Format : NOM Postnom Prenom
        return f"{obj.nom.upper()} {obj.postnom} {obj.prenom}"

class TransactionCantineSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionCantine
        fields = '__all__'


from rest_framework import serializers
from .models import Visiteur, Detenu, Watchlist
from django.utils import timezone
from datetime import timedelta


from rest_framework import serializers
from .models import Visiteur, Detenu, Watchlist # Assure-toi que Watchlist est importé
from django.utils import timezone

class VisiteurSerializer(serializers.ModelSerializer):
    # Détails complets du détenu pour l'affichage de l'agent
    detenu_details = DetenuSerializer(source='detenu_visite', read_only=True)
    
    # Champs calculés (Ton intelligence embarquée)
    indicateur_danger = serializers.SerializerMethodField()
    temps_passe = serializers.SerializerMethodField()
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    piece_identite_url = Base64ImageField(required=False)

    class Meta:
        model = Visiteur
        fields = '__all__'

    def get_indicateur_danger(self, obj):
        """Ton calcul de score de risque visuel"""
        if obj.type_visiteur == 'AVOCAT':
            return "LEGAL"
        
        # Vérification croisée avec la liste noire (Watchlist)
        if Watchlist.objects.filter(nom_complet__iexact=obj.nom_complet).exists():
            return "CRITIQUE"
        
        # Alerte manuelle ou niveau d'alerte élevé
        if obj.alerte_securite or (hasattr(obj, 'niveau_alerte') and obj.niveau_alerte > 2):
            return "SUSPECT"
            
        return "NORMAL"

    def get_temps_passe(self, obj):
        """Calcul de la durée de visite en temps réel ou terminé"""
        if obj.heure_entree:
            fin = obj.heure_sortie if obj.heure_sortie else timezone.now()
            diff = fin - obj.heure_entree
            return int(diff.total_seconds() / 60)
        return None
class WatchlistSerializer(serializers.ModelSerializer):
    """Pour la gestion de la liste noire"""
    class Meta:
        model = Watchlist
        fields = '__all__'

from rest_framework import serializers
from .models import Agent

class AgentSerializer(serializers.ModelSerializer):
    # Champs calculés ou formatés pour le frontend High-Tech
    nom_complet = serializers.SerializerMethodField()
    statut_couleur = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = [
            'id', 'uuid', 'matricule', 'nni', 
            'nom', 'postnom', 'prenom', 'nom_complet',
            'sexe', 'date_naissance', 'lieu_naissance', 'groupe_sanguin',
            'grade', 'echelon', 'date_prise_fonction', 'date_fin_contrat',
            'est_officier_judiciaire', 'telephone', 'email_professionnel',
            'adresse_residence', 'contact_urgence_nom', 'contact_urgence_tel',
            'photo', 'scan_signature', 'statut', 'statut_couleur',
            'secteur', 'affectation', 'est_actif', 'date_enrolement'
        ]
        extra_kwargs = {
            'code_pin_securite': {'write_only': True} # Il ne sera jamais envoyé au frontend
        }
        read_only_fields = ['uuid', 'date_enrolement']

    def get_nom_complet(self, obj):
        return f"{obj.nom.upper()} {obj.postnom} {obj.prenom}"

    def get_statut_couleur(self, obj):
        """Retourne le code couleur selon le statut pour React"""
        mapping = {
            'EN POSTE': '#007FFF', # Bleu RDC
            'CONGÉ': '#F7D618',    # Jaune
            'ALERTE': '#CE1021',   # Rouge
            'MISSION': '#10B981'   # Vert
        }
        return mapping.get(obj.statut, '#718096')

    def validate_nni(self, value):
        """Vérification format NNI (Exemple)"""
        if len(value) < 10:
            raise serializers.ValidationError("Le NNI doit comporter au moins 10 caractères.")
        return value

    def validate_matricule(self, value):
        """Force le matricule en majuscules"""
        return value.upper()



from rest_framework import serializers
from .models import Pointage, Agent

class PointageSerializer(serializers.ModelSerializer):
    # On affiche des détails de l'agent en lecture seule pour le tableau React
    nom_agent = serializers.ReadOnlyField(source='agent.nom')
    postnom_agent = serializers.ReadOnlyField(source='agent.postnom')
    prenom_agent = serializers.ReadOnlyField(source='agent.prenom')
    matricule_agent = serializers.ReadOnlyField(source='agent.matricule')

    class Meta:
        model = Pointage
        fields = [
            'id', 'agent', 'nom_agent', 'postnom_agent', 'prenom_agent', 
            'matricule_agent', 'date_jour', 'heure_arrivee', 
            'statut', 'methode'
        ]



from rest_framework import serializers
from .models import Article, MouvementStock

from rest_framework import serializers
from .models import Article, HistoriqueArticle, MouvementStock

class HistoriqueArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriqueArticle
        fields = '__all__'

class ArticleSerializer(serializers.ModelSerializer):
    en_rupture = serializers.SerializerMethodField()
    # On peut inclure l'historique si besoin
    historique = HistoriqueArticleSerializer(many=True, read_only=True, source='historique_modifs')

    class Meta:
        model = Article
        fields = [
            'id', 'nom', 'categorie', 'quantite', 'unite', 
            'seuil_alerte', 'valeur_unitaire', 'en_rupture', 
            'est_archive', 'historique'
        ]

    def get_en_rupture(self, obj):
        return obj.quantite <= obj.seuil_alerte

class MouvementStockSerializer(serializers.ModelSerializer):
    article_nom = serializers.CharField(source='article.nom', read_only=True)
    operateur_nom = serializers.CharField(source='operateur.username', default='INTENDANT', read_only=True)

    class Meta:
        model = MouvementStock
        fields = '__all__'

from rest_framework import serializers
from .models import Agent, Absence, Planning

class AbsenceSerializer(serializers.ModelSerializer):
    agent_nom_complet = serializers.SerializerMethodField()
    matricule = serializers.CharField(source='agent.matricule', read_only=True)

    class Meta:
        model = Absence
        fields = '__all__'

    def get_agent_nom_complet(self, obj):
        return f"{obj.agent.nom} {obj.agent.postnom}"
class PlanningSerializer(serializers.ModelSerializer):
    # On ajoute ce champ pour que l'API accepte le matricule à la place de l'ID
    agent_matricule = serializers.SlugRelatedField(
        slug_field='matricule', 
        queryset=Agent.objects.all(),
        source='agent' # Ceci dit à Django d'enregistrer le résultat dans le champ 'agent'
    )
    agent_nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = Planning
        fields = ['id', 'agent_matricule', 'agent_nom_complet', 'date', 'vacation', 'secteur_affecte', 'est_present']

    def get_agent_nom_complet(self, obj):
        return f"{obj.agent.nom} {obj.agent.postnom}"


from rest_framework import serializers
from .models import ActiviteJournaliere, RationAlimentaire, Corvee, Detenu

class ActiviteJournaliereSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActiviteJournaliere
        fields = '__all__'

class RationAlimentaireSerializer(serializers.ModelSerializer):
    manquant = serializers.SerializerMethodField()

    class Meta:
        model = RationAlimentaire
        fields = '__all__'

    def get_manquant(self, obj):
        return obj.total_attendu - obj.total_servi

class CorveeSerializer(serializers.ModelSerializer):
    # Pour afficher les noms des détenus au lieu de simples IDs dans les listes
    noms_detenus = serializers.StringRelatedField(many=True, read_only=True, source='detenus_assignes')

    class Meta:
        model = Corvee
        fields = '__all__'





from rest_framework import serializers

class DecesSerializer(serializers.ModelSerializer):
    detenu_nom = serializers.ReadOnlyField(source='detenu.nom')
    detenu_prenom = serializers.ReadOnlyField(source='detenu.prenom')
    matricule = serializers.ReadOnlyField(source='detenu.matricule')
    declare_par_nom = serializers.ReadOnlyField(source='declare_par.username')
    valide_par_nom = serializers.ReadOnlyField(source='valide_par.username')

    class Meta:
        model = Deces
        fields = '__all__'
        read_only_fields = ['declare_par', 'valide_par', 'statut', 'is_deleted', 'deleted_at']

    def validate_detenu(self, value):
        if value.etat == 'DECEDE':
            raise ValidationError("Ce détenu est déjà déclaré décédé.")
        return value




from rest_framework import serializers
from .models import TraceurAudit

class TraceurAuditSerializer(serializers.ModelSerializer):
    # On récupère le nom d'utilisateur pour un affichage direct sur le Dashboard
    agent_identifiant = serializers.CharField(source='utilisateur.username', read_only=True, default="SYSTÈME AUTOMATISÉ")
    
    # Formatage de la date à la norme francophone
    date_action_formattee = serializers.DateTimeField(source='date_action', format="%d/%m/%Y %H:%M:%S", read_only=True)
    
    # On affiche le nom du modèle ciblé (la table)
    type_entite = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = TraceurAudit
        fields = [
            'id', 
            'type_entite', 
            'object_id', 
            'type_action', 
            'table_concernee', 
            'etat_ancien', 
            'etat_actuel', 
            'utilisateur', 
            'agent_identifiant', 
            'date_action', 
            'date_action_formattee', 
            'adresse_ip'
        ]