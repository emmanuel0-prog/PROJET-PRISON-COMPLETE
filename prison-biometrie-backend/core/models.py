# ================================
# STANDARD LIBRARY
# ================================
import json
import uuid
import datetime
import threading

# ================================
# DJANGO CORE
# ================================
from django.db import models
from django.conf import settings
from django.utils import timezone

# ================================
# DJANGO UTILITIES
# ================================
from django.core.exceptions import ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict
from users.models import User
from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


# ================================
# DJANGO SIGNALS
# ================================
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

# ================================
# DJANGO CONTENT TYPES (si utilisé)
# ================================
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

# ================================
# IMPORT LOCAL
# ================================
from .middleware import _thread_locals

# --- UTILITAIRE POUR RÉCUPÉRER L'UTILISATEUR COURANT ---
_thread_locals = threading.local()

def get_current_user():
    user = getattr(_thread_locals, 'user', None)
    return user if user and user.is_authenticated else None


def get_current_ip():
    return getattr(_thread_locals, 'ip', None)

# --- MIXIN D'AUDIT (LE CERVEAU) ---



class AuditMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._etat_initial = self._capturer_etat()

    def _capturer_etat(self):
        if self.pk:
            return model_to_dict(self)
        return {}

    def enregistrer_audit(self, type_action):
        user = get_current_user()
        ip = get_current_ip()
        etat_actuel = self._capturer_etat()

        anciens = {}
        nouveaux = {}

        if type_action == 'MODIFICATION':
            for champ, valeur in etat_actuel.items():
                valeur_anc = self._etat_initial.get(champ)
                if valeur != valeur_anc:
                    anciens[champ] = str(valeur_anc)
                    nouveaux[champ] = str(valeur)

        elif type_action == 'CREATION':
            nouveaux = {k: str(v) for k, v in etat_actuel.items()}

        elif type_action == 'SUPPRESSION':
            anciens = {k: str(v) for k, v in self._etat_initial.items()}

        if nouveaux or anciens or type_action == 'SUPPRESSION':
            TraceurAudit.objects.create(
                content_type=ContentType.objects.get_for_model(self),
                object_id=str(self.pk),
                type_action=type_action,
                table_concernee=self.__class__.__name__,
                etat_ancien=anciens,
                etat_actuel=nouveaux,
                utilisateur=user,
                adresse_ip=ip
            )


# --- Base pour tous tes modèles avec Audit ---
class BaseAuditModel(AuditMixin, models.Model):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        action = 'MODIFICATION' if self.pk else 'CREATION'
        super().save(*args, **kwargs)
        self.enregistrer_audit(action)

    def delete(self, *args, **kwargs):
        self.enregistrer_audit('SUPPRESSION')
        super().delete(*args, **kwargs)
        

# --- TABLE D'AUDIT GLOBALE ---



class TraceurAudit(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=100)  # ✅ FIX UUID
    content_object = GenericForeignKey('content_type', 'object_id')

    type_action = models.CharField(max_length=20)
    table_concernee = models.CharField(max_length=100)

    etat_ancien = models.JSONField(null=True, blank=True)
    etat_actuel = models.JSONField(null=True, blank=True)

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    date_action = models.DateTimeField(auto_now_add=True)
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.table_concernee} - {self.type_action}"
    



class SalleParloir(models.Model):
    nom = models.CharField(max_length=50, unique=True) # Ex: P-01, Salle A
    capacite = models.IntegerField(default=1)
    est_active = models.BooleanField(default=True)

    def __str__(self):
        return self.nom

class ProgrammationVisite(models.Model):
    TYPE_CHOICES = [
        ('FAMILLE', 'Famille'),
        ('AVOCAT', 'Avocat'),
        ('PRO', 'Professionnel'),
    ]

    visiteur_nom = models.CharField(max_length=255)
    # Relation avec ton modèle Detenu existant
    detenu = models.ForeignKey('Detenu', on_delete=models.CASCADE, related_name='visites_programmees')
    salle = models.ForeignKey(SalleParloir, on_delete=models.CASCADE)
    
    date_visite = models.DateField()
    heure_debut = models.TimeField()
    type_visite = models.CharField(max_length=20, choices=TYPE_CHOICES, default='FAMILLE')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # CONTRAINTE CRITIQUE : Une seule visite par salle/date/heure
        unique_together = ('salle', 'date_visite', 'heure_debut')
        ordering = ['date_visite', 'heure_debut']

    def __str__(self):
        return f"{self.visiteur_nom} -> {self.detenu.nom} ({self.date_visite})"
# ========================
# LOCALISATION & PRISON
# ========================

class Province(AuditMixin, models.Model):
    nom = models.CharField(max_length=100)

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        action = 'MODIFICATION' if self.pk else 'CREATION'
        super().save(*args, **kwargs)
        self.enregistrer_audit(action)

    def delete(self, *args, **kwargs):
        self.enregistrer_audit('SUPPRESSION')
        super().delete(*args, **kwargs)
    
class Ville(AuditMixin, models.Model):
    nom = models.CharField(max_length=100)
    province = models.ForeignKey(Province, on_delete=models.CASCADE)

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        action = 'MODIFICATION' if self.pk else 'CREATION'
        super().save(*args, **kwargs)
        self.enregistrer_audit(action)

    def delete(self, *args, **kwargs):
        self.enregistrer_audit('SUPPRESSION')
        super().delete(*args, **kwargs)

class Prison(AuditMixin, models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    adresse = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    ville = models.ForeignKey(Ville, on_delete=models.CASCADE)
    capacite = models.PositiveBigIntegerField()
    directeur = models.CharField(max_length=100)

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        action = 'MODIFICATION' if self.pk else 'CREATION'
        super().save(*args, **kwargs)
        self.enregistrer_audit(action)

    def delete(self, *args, **kwargs):
        self.enregistrer_audit('SUPPRESSION')
        super().delete(*args, **kwargs)











class Detenu(AuditMixin, models.Model):
    # CHOIX
    SEXE_CHOICES = (('M', 'Masculin'), ('F', 'Féminin'))
    STATUT_MATRIMONIAL = (
        ('CELIBATAIRE', 'Célibataire'), ('MARIE', 'Marié(e)'),
        ('DIVORCE', 'Divorcé(e)'), ('VEUF', 'Veuf/Veuve'), ('UNION_LIBRE', 'Union Libre'),
    )
    STATUT_CH = (
        ('PREVENU', 'Prévenu'), ('DETENU_PREVENTIF', 'Détenu Préventif'),
        ('CONDAMNE', 'Condamné'), ('CONDAMNE_PREVENTIF', 'Condamné Préventif'),
        ('LIBERE', 'Libéré / Expiré'), ('MORT', 'Mort en détention'),
    )

    # CHAMPS DE BASE
    est_supprime = models.BooleanField(default=False)
    date_suppression = models.DateTimeField(null=True, blank=True)
    matricule = models.CharField(max_length=30, unique=True, blank=True)
    nom = models.CharField(max_length=100)
    postnom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES)
    date_naissance = models.DateField()
    lieu_naissance = models.CharField(max_length=100, blank=True)
    nationalite = models.CharField(max_length=50, default="Congolaise")
    etat_civil = models.CharField(max_length=20, choices=STATUT_MATRIMONIAL, default='CELIBATAIRE')
    nombre_enfants = models.PositiveIntegerField(default=0)
    profession = models.CharField(max_length=100, blank=True)
    adresse_residence = models.TextField(blank=True)
    nom_pere = models.CharField(max_length=100, null=True, blank=True)
    nom_mere = models.CharField(max_length=100, null=True, blank=True)

    # PHYSIQUE
    taille = models.PositiveIntegerField(null=True, blank=True)
    teint = models.CharField(max_length=50, blank=True, null=True)
    pointure = models.PositiveIntegerField(null=True, blank=True)
    signes_particuliers = models.TextField(blank=True)
    photo = models.ImageField(upload_to="detenus/photos/", blank=True, null=True)

    # --- CHAMPS REQUIS POUR LE SEED ---
    contact_urgence_nom = models.CharField(max_length=150, blank=True, null=True)
    contact_urgence_tel = models.CharField(max_length=20, blank=True, null=True)
    lien_parente = models.CharField(max_length=50, blank=True, null=True)
    autorite_judiciaire = models.CharField(max_length=150, blank=True, null=True)
    regime_alimentaire = models.CharField(max_length=50, default='Normal')

    # LOGISTIQUE & ÉTAT
    prison = models.ForeignKey(Prison, on_delete=models.CASCADE)
    statut_juridique = models.CharField(max_length=30, choices=STATUT_CH, default='PREVENU')
    date_entree = models.DateField(auto_now_add=True)
    solde = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    pavillon_actuel = models.CharField(max_length=50, blank=True, null=True)
    cellule_actuelle = models.CharField(max_length=20, blank=True, null=True)
    etat = models.CharField(max_length=20, default='PRÉSENT')
    est_dangereux = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        action = 'MODIFICATION' if self.pk else 'CREATION'
        
        # Génération matricule intelligente
        if not self.matricule:
            year = datetime.date.today().year
            last = Detenu.objects.filter(matricule__contains=f"MAT-{year}").order_by('-id').first()
            new_num = int(last.matricule.split('-')[-1]) + 1 if last else 1
            self.matricule = f"MAT-{year}-{new_num:04d}"

        super().save(*args, **kwargs)
        self.enregistrer_audit(action)

    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.postnom} {self.prenom}"
    




# --- MODÈLES OPÉRATIONNELS ---

class ActiviteJournaliere(BaseAuditModel):
    TYPE_CHOICES = [
        ('ROUTINE', 'Routine'), 
        ('TRAVAIL', 'Travail'), 
        ('CANTINE', 'Cantine'), 
        ('LOISIR', 'Loisir')
    ]
    
    label = models.CharField(max_length=200)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    type_activite = models.CharField(max_length=20, choices=TYPE_CHOICES)
    nb_detenus_prevus = models.IntegerField()
    est_actuelle = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label} ({self.type_activite})"

class RationAlimentaire(BaseAuditModel):
    REPAS_CHOICES = [
        ('PETIT_DEJ', 'Petit Déjeuner'), 
        ('DEJEUNER', 'Déjeuner'), 
        ('DINER', 'Dîner')
    ]
    
    date = models.DateField(auto_now_add=True)
    repas = models.CharField(max_length=20, choices=REPAS_CHOICES)
    total_servi = models.IntegerField(default=0)
    total_attendu = models.IntegerField()
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.repas} - {self.date}"

class Corvee(BaseAuditModel):
    STATUT_CHOICES = [
        ('EN_COURS', 'En cours'), 
        ('TERMINE', 'Terminé'), 
        ('INCIDENT', 'Incident')
    ]
    
    label = models.CharField(max_length=200)
    responsable_equipe = models.CharField(max_length=100)
    detenus_assignes = models.ManyToManyField('Detenu', related_name="corvees")
    statut = models.CharField(max_length=50, choices=STATUT_CHOICES, default="EN_COURS")
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label} - {self.statut}"
    







    

# =================================================================
# 1. DOSSIER JUDICIAIRE (Hérite de l'Audit)
# =================================================================
class DossierJudiciaire(BaseAuditModel):
    """
    Pivot central du suivi pénal d'un détenu.
    """
    # Relation unique : Un détenu = Un dossier actif
    detenu = models.OneToOneField(
        'Detenu', 
        on_delete=models.CASCADE, 
        related_name="dossier_judiciaire"
    )
    
    # --- RÉFÉRENCES OFFICIELLES ---
    numero_rmp = models.CharField(
        max_length=50, 
        verbose_name="N° R.M.P", 
        null=True,
        help_text="Registre du Ministère Public (ex: 1234/PG/026)"
    )
    numero_rp = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        verbose_name="N° R.P", 
        help_text="Registre Public du Tribunal"
    )

    # --- ACTEURS JUDICIAIRES ---
    parquet_origine = models.ForeignKey(
        'Parquet', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    tribunal_saisi = models.CharField(
        max_length=150, 
        null=True,
        verbose_name="Tribunal / Juridiction"
    )
    magistrat_instructeur = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Magistrat en charge"
    )

    # --- INFRACTIONS ET PEINE ---
    chef_inculpation = models.TextField(
        verbose_name="Préventions / Infractions",
        help_text="Ex: Vol à main armée, Association de malfaiteurs",
        null=True, 
        blank=True
    )
    peine_prononcee = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Peine (si condamné)",
        help_text="Ex: 5 ans de servitude pénale principale"
    )
    
    # --- DATES CLÉS ---
    date_faits = models.DateField(null=True, blank=True)
    date_jugement = models.DateField(null=True, blank=True)
    date_expiration_peine = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Date de libération prévue"
    )

    def __str__(self):
        return f"Dossier {self.numero_rmp} - {self.detenu.nom}"

    class Meta:
        verbose_name = "Dossier Judiciaire"
        verbose_name_plural = "Dossiers Judiciaires"


# =================================================================
# 2. DOCUMENTS D'ÉCROU (Audit + Soft Delete)
# =================================================================
class DocumentEcrou(BaseAuditModel):
    TYPE_DOC = (
        ('MAP', 'Mandat d\'Arrêt Provisoire'),
        ('ODP', 'Ordonnance de Détention Préventive'),
        ('JUGEMENT', 'Jugement de Condamnation'),
        ('ARRET', 'Arrêt de Justice/Appel'),
        ('LRP', 'Levée de l\'Écrou'), 
    )
    
    detenu = models.ForeignKey(
        'Detenu', 
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    
    type_document = models.CharField(max_length=20, choices=TYPE_DOC)
    numero_document = models.CharField(
        max_length=100, 
        verbose_name="Référence du document",
        help_text="N° de Dossier RMP, RP ou extrait de jugement"
    )
    
    parquet_emetteur = models.ForeignKey(
        'Parquet', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    fichier_scanne = models.FileField(
        upload_to="ecrous/documents/%Y/%m/", 
        help_text="Fichier PDF ou Image du document officiel"
    )
    
    date_emission = models.DateField(verbose_name="Date de signature")
    date_expiration = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Date d'expiration légale"
    )

    # Gestion de la corbeille
    est_archive = models.BooleanField(default=False)
    date_archivage = models.DateTimeField(null=True, blank=True)

    def delete(self, *args, **kwargs):
        """
        Surcharge : Au lieu de supprimer de la BDD, on archive et on log l'action.
        """
        self.est_archive = True
        self.date_archivage = timezone.now()
        # On appelle le save() du parent pour déclencher l'audit 'MODIFICATION'
        self.save()

    def restore(self):
        """Sortir un document de la corbeille"""
        self.est_archive = False
        self.date_archivage = None
        self.save()

    def __str__(self):
        return f"{self.get_type_document_display()} - {self.detenu.nom} ({self.numero_document})"

    class Meta:
        verbose_name = "Document d'Écrou"
        verbose_name_plural = "Documents d'Écrous"


# =================================================================
# 3. HISTORIQUE SPÉCIFIQUE (Log technique dédié)
# =================================================================
class DocumentEcrouHistory(models.Model):
    """
    Table de log rapide pour l'affichage frontal des modifications de documents.
    """
    document = models.ForeignKey(DocumentEcrou, on_delete=models.CASCADE, related_name='historique')
    utilisateur = models.CharField(max_length=100)
    action = models.CharField(max_length=50) 
    champ = models.CharField(max_length=100) 
    ancienne_valeur = models.TextField(null=True)
    nouvelle_valeur = models.TextField(null=True)
    date_action = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_action']


# =================================================================
# 4. LIBÉRATION (Audit + Workflow)
# =================================================================
class Liberation(BaseAuditModel):
    """
    Processus de sortie définitive du détenu.
    """
    detenu = models.OneToOneField(
        'Detenu', 
        on_delete=models.CASCADE, 
        related_name='dossier_liberation'
    )
    motif = models.CharField(max_length=100)
    date_liberation = models.DateField()
    autorite_ordonnante = models.CharField(max_length=255, blank=True, null=True)
    observations = models.TextField(blank=True, null=True)
    
    # Fichier OML (Ordre de Mise en Liberté)
    fichier_oml = models.FileField(upload_to='liberations/oml/', blank=True, null=True)
    
    # Validation du workflow administratif
    workflow_juridictionnelle = models.BooleanField(default=False)
    workflow_parquet = models.BooleanField(default=False)
    workflow_greffe = models.BooleanField(default=False)
    workflow_restitution = models.BooleanField(default=False) # Remise des effets personnels
    
    date_enregistrement = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Libération de {self.detenu.nom} - {self.date_liberation}"
# ========================
# HISTORIQUE LIBERATION
# ========================

# ========================
# CELLULE & AFFECTATION
# ========================


# --- MODÈLES ---

class Pavillon(BaseAuditModel):
    TYPES_ZONE = (
        ('NORMAL', 'Zone Standard'),
        ('ISOLEMENT', 'Isolement / Sanction'),
        ('HAUTE_SECURITE', 'Haute Sécurité (Dangerosité Élevée)'),
        ('INFIRMERIE', 'Zone Médicale'),
        ('FEMME', 'Quartier Femmes'),
    )
    nom = models.CharField(max_length=100, unique=True)
    type_zone = models.CharField(max_length=20, choices=TYPES_ZONE, default='NORMAL')
    description = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nom} [{self.get_type_zone_display()}]"

class PavillonHistory(models.Model):
    pavillon = models.ForeignKey(Pavillon, on_delete=models.CASCADE, related_name='history')
    modifie_par = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    date_modification = models.DateTimeField(auto_now_add=True)
    etat_ancien = models.JSONField()
    etat_actuel = models.JSONField()
    action = models.CharField(max_length=50) # ex: 'UPDATE', 'RESTORE'

    class Meta:
        ordering = ['-date_modification']

from django.db import models
from django.conf import settings

class Cellule(BaseAuditModel):
    pavillon = models.ForeignKey('Pavillon', on_delete=models.CASCADE, related_name="cellules")
    numero = models.CharField(max_length=20)
    capacite_max = models.PositiveIntegerField()
    is_deleted = models.BooleanField(default=False) # Pour la corbeille

    @property
    def occupation_actuelle(self):
        # On compte les affectations actives (sans date de sortie)
        return self.affectations.filter(date_sortie__isnull=True).count()

    @property
    def est_pleine(self):
        return self.occupation_actuelle >= self.capacite_max

    def __str__(self):
        return f"Cellule {self.numero} (Pav. {self.pavillon.nom})"

class CelluleHistory(models.Model):
    cellule = models.ForeignKey(Cellule, on_delete=models.CASCADE, related_name='history')
    modifie_par = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    date_modification = models.DateTimeField(auto_now_add=True)
    etat_ancien = models.JSONField()
    etat_actuel = models.JSONField()
    action = models.CharField(max_length=50) # ex: 'UPDATE', 'RESTORE'



# ================================
# AFFECTATION
# ================================
class AffectationCellule(models.Model):
    detenu = models.ForeignKey('core.Detenu', on_delete=models.CASCADE, related_name="affectations")
    cellule = models.ForeignKey('core.Cellule', on_delete=models.CASCADE, related_name="affectations")

    date_entree = models.DateTimeField(default=timezone.now)
    date_sortie = models.DateTimeField(null=True, blank=True)

    motif_affectation = models.CharField(max_length=200, blank=True, null=True)
    is_deleted = models.BooleanField(default=False)

    def clean(self):
        if self.date_sortie is None and not self.is_deleted:

            if self.pk is None and self.cellule.est_pleine:
                raise ValidationError(f"La cellule {self.cellule.numero} est saturée.")

            if self.detenu.est_dangereux and self.cellule.pavillon.type_zone not in ['HAUTE_SECURITE', 'ISOLEMENT']:
                raise ValidationError("SÉCURITÉ : Détenu dangereux interdit en zone standard !")

            if (not self.detenu.est_dangereux) and self.cellule.pavillon.type_zone == 'HAUTE_SECURITE':
                raise ValidationError("ERREUR : détenu standard interdit en haute sécurité")

    def save(self, *args, **kwargs):
        if not self.date_entree:
            self.date_entree = timezone.now()

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.detenu.nom} {self.detenu.prenom} -> {self.cellule.numero}"


# ================================
# HISTORIQUE
# ================================
class AffectationCelluleHistory(models.Model):
    affectation = models.ForeignKey(AffectationCellule, on_delete=models.CASCADE, related_name='logs')
    modifie_par = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    date_modification = models.DateTimeField(auto_now_add=True)

    detenu_nom = models.CharField(max_length=255, null=True, blank=True)
    cellule_numero = models.CharField(max_length=50, null=True, blank=True)
    pavillon_nom = models.CharField(max_length=100, null=True, blank=True)

    etat_ancien = models.JSONField(null=True)
    etat_actuel = models.JSONField()

    action = models.CharField(max_length=50)

    class Meta:
        verbose_name_plural = "Histories - Affectations"
        ordering = ['-date_modification']


# ================================
# PRE SAVE (ANCIEN ETAT)
# ================================
@receiver(pre_save, sender=AffectationCellule)
def capture_ancien_etat(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_obj = AffectationCellule.objects.get(pk=instance.pk)
            instance._old_state = model_to_dict(old_obj)
        except AffectationCellule.DoesNotExist:
            instance._old_state = None
    else:
        instance._old_state = None


# ================================
# POST SAVE (SAFE + FIX COMPLET)
# ================================
@receiver(post_save, sender=AffectationCellule)
def create_history_and_sync_detenu(sender, instance, created, **kwargs):
    # 🔥 ANTI BOUCLE SIGNAL
    if getattr(instance, "_skip_signal", False):
        return

    try:
        # ================================
        # ACTION
        # ================================
        action = 'CREATE' if created else 'UPDATE'

        if instance.is_deleted and instance._old_state and not instance._old_state.get('is_deleted'):
            action = 'DELETE'
        elif not instance.is_deleted and instance._old_state and instance._old_state.get('is_deleted'):
            action = 'RESTORE'

        # ================================
        # ETAT ACTUEL
        # ================================
        etat_actuel_dict = model_to_dict(instance)
        detenu_nom_complet = f"{instance.detenu.nom} {instance.detenu.prenom or ''}".strip()
        etat_actuel_dict['detenu_nom'] = detenu_nom_complet
        etat_actuel_dict['cellule_numero'] = instance.cellule.numero
        etat_actuel_dict['pavillon_nom'] = getattr(instance.cellule.pavillon, 'nom', str(instance.cellule.pavillon))

        etat_actuel_clean = json.loads(json.dumps(etat_actuel_dict, cls=DjangoJSONEncoder))

        # ================================
        # ETAT ANCIEN
        # ================================
        etat_ancien_clean = None
        if instance._old_state:
            old_dict = instance._old_state
            old_dict['detenu_nom'] = detenu_nom_complet
            etat_ancien_clean = json.loads(json.dumps(old_dict, cls=DjangoJSONEncoder))

        # ================================
        # HISTORIQUE
        # ================================
        AffectationCelluleHistory.objects.create(
            affectation=instance,
            detenu_nom=detenu_nom_complet,
            cellule_numero=instance.cellule.numero,
            pavillon_nom=getattr(instance.cellule.pavillon, 'nom', str(instance.cellule.pavillon)),
            etat_ancien=etat_ancien_clean,
            etat_actuel=etat_actuel_clean,
            action=action
        )

        # ================================
        # SYNC DETENU (FIX IMPORTANT)
        # ================================
        if not instance.is_deleted and instance.date_sortie is None:
            from core.models import Detenu
            
            # 🔥 LE FIX EST ICI : On force la conversion en chaîne de caractères avec str()
            # pour éviter le TypeError avec le CharField
            nom_pavillon = str(getattr(instance.cellule.pavillon, 'nom', instance.cellule.pavillon))
            numero_cellule = str(instance.cellule.numero)

            Detenu.objects.filter(id=instance.detenu.id).update(
                pavillon_actuel=nom_pavillon,  
                cellule_actuelle=numero_cellule
            )

    except Exception as e:
        # 🔥 EMPÊCHE LE 500 ERROR DE REMONTER AU FRONT
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"SIGNAL ERROR (ignored): {str(e)}")

# --- MODÈLE D'HISTORIQUE PERSONNALISÉ TRIBUNAL ---


class Tribunal(BaseAuditModel):
    TYPES = [
        ('TRIPAIX', 'Tribunal de Paix'),
        ('TGI', 'Tribunal de Grande Instance'),
        ('COMMERCIAL', 'Tribunal de Commerce'),
        ('TRAVAIL', 'Tribunal du Travail'),
        ('MILITAIRE', 'Juridiction Militaire'),
        ('COUR_APPEL', "Cour d'Appel"),
        ('COUR_CASSATION', 'Cour de Cassation'),
    ]

    nom = models.CharField(max_length=255, unique=True)
    type_juridiction = models.CharField(max_length=50, choices=TYPES)
    ville = models.CharField(max_length=100)
    commune = models.CharField(max_length=100, blank=True)
    adresse = models.TextField(blank=True)

    def __str__(self):
        return self.nom





# --- FIN MODÈLE D'HISTORIQUE PERSONNALISÉ TRIBUNAL ---




# --- MODÈLE D'HISTORIQUE PERSONNALISÉ P ---

class Parquet(BaseAuditModel):
    TYPE_PARQUET = (
        ('PG', 'Parquet Général'),
        ('PGI', 'Parquet de Grande Instance'),
        ('PP', 'Parquet près Tribunal de Paix'),
        ('PM', 'Parquet Militaire'),
    )

    nom = models.CharField(max_length=200)
    tribunal = models.ForeignKey(
        Tribunal,
        on_delete=models.CASCADE,null=True, blank=True,
        related_name="parquets"
    )
    ville = models.CharField(max_length=100, default="Kinshasa")
    type_parquet = models.CharField(max_length=10, choices=TYPE_PARQUET)
    adresse = models.TextField(blank=True)
    contact_procureur = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.nom} → {self.tribunal.nom}"










class MouvementExterieur(BaseAuditModel):
    DESTINATIONS = [
        ('TRIBUNAL', 'Tribunal / Parquet'), 
        ('HÔPITAL', 'Hôpital / Centre de Santé'), 
        ('TRANSFERT', 'Transfèrement Pénitentiaire'),
        ('AUTRE', 'Autre (Humanitaire/Exceptionnel)')
    ]
    
    TYPES_ACTE = [
        ('MANDAT_EXTRACTION', "Mandat d'Extraction"),
        ('MANDAT_AMENER', "Mandat d'Amener"),
        ('REQUISITION_PARQUET', "Réquisition du Parquet"),
        ('ORDONNANCE_COMPARUTION', "Ordonnance de Comparution"),
        ('ORDRE_SOINS', "Ordre d'Extraction pour Soins"),
        ('ORDRE_TRANSFERT', "Ordre de Transfèrement"),
        ('AUTRE_ACTE', "Autre Document Officiel"),
    ]

    STATUTS = [
        ('HORS MURS', 'Hors Murs'), 
        ('RETOURNE', 'Retourné')
    ]

    detenu = models.ForeignKey('Detenu', on_delete=models.CASCADE, related_name="mouvements")
    tribunal = models.ForeignKey(
        'Tribunal', on_delete=models.SET_NULL, null=True, blank=True,
        help_text="Spécifier la juridiction si destination = TRIBUNAL"
    )

    type_acte = models.CharField(max_length=30, choices=TYPES_ACTE, default='MANDAT_EXTRACTION')
    num_reference_acte = models.CharField(max_length=100, null=True, blank=True)
    
    destination = models.CharField(max_length=100, choices=DESTINATIONS)
    motif_details = models.TextField(blank=True)
    escorte = models.CharField(max_length=100)
    
    mandat_verifie = models.BooleanField(default=False)
    ordre_mission_verifie = models.BooleanField(default=False)

    heure_sortie = models.DateTimeField(auto_now_add=True)
    heure_retour = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='HORS MURS')
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()


    class Meta:
        verbose_name = "Mouvement Extérieur"
        verbose_name_plural = "Mouvements Extérieurs"
        ordering = ['-heure_sortie']

    def __str__(self):
        return f"{self.detenu.nom} - {self.get_type_acte_display()} ({self.num_reference_acte})"

    def marquer_retour(self):
        self.heure_retour = timezone.now()
        self.statut = 'RETOURNE'
        self.save()




# Modèle pour l'Historique (Audit Trail)
class HistoriqueMouvement(BaseAuditModel):
    ACTION_CHOICES = [
        ('CREATE', 'Création'),
        ('UPDATE', 'Modification'),
        ('DELETE', 'Suppression (Archive)'),
        ('RESTORE', 'Restauration'),
    ]

    mouvement = models.ForeignKey(MouvementExterieur, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    date_modification = models.DateTimeField(auto_now_add=True)
    modifie_par = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    # Stockage JSON des états
    etat_ancien = models.JSONField(null=True)
    etat_actuel = models.JSONField(null=True)

    class Meta:
        ordering = ['-date_modification']









# =================================================================
# 1. SÉCURITÉ & BIOMÉTRIE
# =================================================================

class BiometrieDetenu(BaseAuditModel):
    detenu = models.OneToOneField(Detenu, on_delete=models.CASCADE, related_name="biometrie")
    empreintes_digitale = models.JSONField(help_text="Templates des 10 doigts")
    face_encoding = models.TextField(help_text="Signature faciale", null=True, blank=True)
    date_enrolement = models.DateTimeField(auto_now_add=True)

class Watchlist(BaseAuditModel):
    nom_complet = models.CharField(max_length=255)
    motif = models.TextField()
    numero_piece_identite = models.CharField(max_length=100, unique=True, null=True)
    photo_reference = models.ImageField(upload_to='watchlist_photos/', null=True)
    niveau_danger = models.CharField(max_length=50, choices=[('ROUGE', 'Interdiction Totale'), ('ORANGE', 'Fouille Intégrale')])
    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ALERTE: {self.nom_complet}"

# =================================================================
# 2. GESTION DES VISITES
# =================================================================

class Visiteur(BaseAuditModel):
    TYPE_CHOICES = [
        ('AVOCAT', 'Avocat (Confidentiel)'),
        ('FAMILLE', 'Famille'),
        ('AMI', 'Ami'),
        ('PROFESSIONNEL', 'Professionnel/ONG'),
        ('CONJUGALE', 'Visite Conjugale'),
        ('OFFICIEL', 'Autorité/Renseignement'),
    ]

    STATUT_CHOICES = [
        ('EN ATTENTE', 'En Attente'),
        ('EN PARLOIR', 'En Parloir'),
        ('TERMINE', 'Terminé'),
        ('REFUSE', 'Accès Refusé'),
    ]

    uuid_national = models.UUIDField(default=uuid.uuid4, editable=False)
    token = models.CharField(max_length=50, unique=True, null=True, blank=True)
    nom_complet = models.CharField(max_length=255, null=True, blank=True)
    telephone = models.CharField(max_length=20, null=True, blank=True)
    piece_identite_numero = models.CharField(max_length=50, null=True, blank=True)
    piece_identite_url = models.ImageField(upload_to='identites/', null=True, blank=True)
    effets_consignes = models.TextField(null=True, blank=True, verbose_name="Objets déposés à l'entrée")
    detenu_visite = models.ForeignKey(Detenu, on_delete=models.CASCADE, null=True, related_name='visites')
    type_visiteur = models.CharField(max_length=20, choices=TYPE_CHOICES, default="FAMILLE")
    relation_detenu = models.CharField(max_length=100, null=True, blank=True)
    
    # Sécurité
    alerte_securite = models.BooleanField(default=False)
    notes_renseignement = models.TextField(blank=True, null=True)
    photo_capturee = models.TextField(blank=True, null=True) 
    est_confidentiel = models.BooleanField(default=False)
    niveau_alerte = models.IntegerField(default=0)
    observations_securite = models.TextField(null=True, blank=True)
    objets_consignes = models.TextField(null=True, blank=True)

    heure_entree = models.DateTimeField(default=timezone.now)
    heure_sortie = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN ATTENTE')

    class Meta:
        ordering = ['-heure_entree']
        indexes = [
            models.Index(fields=['nom_complet', 'type_visiteur']),
            models.Index(fields=['statut']),
            models.Index(fields=['token']),
        ]

    def save(self, *args, **kwargs):
        if self.type_visiteur == 'AVOCAT':
            self.est_confidentiel = True
        super().save(*args, **kwargs)

class RegistreVisite(BaseAuditModel):
    visiteur = models.ForeignKey(Visiteur, on_delete=models.CASCADE)
    detenu = models.ForeignKey(Detenu, on_delete=models.CASCADE)
    type_visite = models.CharField(max_length=50, choices=[('FAMILLE', 'Famille'), ('CONJUGALE', 'Conjugale'), ('AVOCAT', 'Avocat')])
    heure_entree = models.DateTimeField(auto_now_add=True)
    heure_sortie = models.DateTimeField(null=True, blank=True)

# =================================================================
# 3. MÉDICAL
# =================================================================

class DossierMedical(BaseAuditModel):
    detenu = models.ForeignKey(Detenu, on_delete=models.CASCADE)
    date_consultation = models.DateTimeField(auto_now_add=True)
    diagnostic = models.TextField()
    ordonnance = models.TextField()
    medecin_responsable = models.CharField(max_length=100)

class Consultation(BaseAuditModel):
    PRIORITES = [('URGENT', '🔴 Urgent'), ('HAUTE', '🟡 Haute'), ('NORMALE', '🟢 Normale')]
    STATUTS = [('EN ATTENTE', '⏳ En Attente'), ('EN EXAMEN', '🩺 En Examen'), ('TRAITÉ', '✅ Traité')]
    
    detenu = models.ForeignKey(Detenu, on_delete=models.CASCADE, related_name='consultations')
    motif = models.CharField(max_length=255)
    priorite = models.CharField(max_length=20, choices=PRIORITES, default='NORMALE')
    statut = models.CharField(max_length=20, choices=STATUTS, default='EN ATTENTE')
    observations = models.TextField(blank=True, verbose_name="Observations cliniques")
    prescription = models.TextField(blank=True, null=True, help_text="Médicaments et posologie")
    date_creation = models.DateTimeField(auto_now_add=True)
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Consultation Médicale"
        ordering = ['-date_creation']

# =================================================================
# 4. LOG D'AUDIT (Le système central)
# =================================================================

class JournalAudit(models.Model):
    """
    Cette table centralise tous les logs d'actions.
    Tous les modèles au-dessus écrivent ici via le signal ou le mixin.
    """
    utilisateur = models.CharField(max_length=100) # Ou FK vers User
    action = models.CharField(max_length=255)
    date_action = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True)

    class Meta:
        ordering = ['-date_action']

import uuid
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
# Assure-toi d'importer ton BaseAuditModel et Detenu ici


# =================================================================
# 1. MÉDICAL & CANTINE
# =================================================================

class StockMedicament(BaseAuditModel):
    nom = models.CharField(max_length=100)
    quantite = models.IntegerField()
    bloc_concerne = models.CharField(max_length=50) 
    heure_distribution = models.TimeField()

    def __str__(self):
        return f"{self.nom} - {self.quantite} (Bloc: {self.bloc_concerne})"

class ArticleCantine(BaseAuditModel):
    nom = models.CharField(max_length=100)
    prix = models.DecimalField(max_digits=10, decimal_places=2) 
    stock = models.IntegerField(default=0)
    disponible = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nom} ({self.prix} $)"

class TransactionCantine(BaseAuditModel):
    detenu = models.ForeignKey(Detenu, on_delete=models.CASCADE, related_name='achats_cantine')
    date = models.DateTimeField(default=timezone.now)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    details = models.TextField(help_text="Liste des articles achetés (format JSON ou texte)")
    
    def save(self, *args, **kwargs):
        """Déduit automatiquement le montant du solde du détenu."""
        with transaction.atomic():
            if not self.pk: # Seulement à la création
                self.detenu.solde -= self.total
                self.detenu.save()
            super().save(*args, **kwargs)

    def __str__(self):
        return f"Achat {self.detenu.nom} - {self.total}$ - {self.date.strftime('%d/%m/%Y')}"

# =================================================================
# 2. ACTIVITÉS & JOURNALISATION
# =================================================================

class JournalActivite(models.Model):
    ACTIONS = (
        ('CREATION', 'Ouverture Dossier'),
        ('EDITION', 'Modification'),
        ('MOUVEMENT', 'Mouvement Interne'),
        ('CORBEILLE', 'Mise en Corbeille'),
        ('RESTAURATION', 'Restauration'),
    )

    detenu = models.ForeignKey(Detenu, on_delete=models.CASCADE, related_name='historique')
    action = models.CharField(max_length=20, choices=ACTIONS)
    description = models.TextField()
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True
    )
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)
    date_action = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_action']

# =================================================================
# 3. RESSOURCES HUMAINES (Agents & Pointage)
# =================================================================

class Agent(BaseAuditModel):
    STATUT_CHOICES = [
        ('EN POSTE', 'En Poste'),
        ('CONGÉ', 'En Congé'),
        ('MISSION', 'En Mission'),
        ('ALERTE', 'Alerte Pointage'),
    ]

    SECTEUR_CHOICES = [
        ('SECURITE', 'Sécurité Intérieure'),
        ('LOGISTIQUE', 'Logistique'),
        ('ADMIN', 'Administration / Greffe'),
        ('MEDICAL', 'Unité Médicale'),
    ]

    # --- IDENTIFICATION ---
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    matricule = models.CharField(max_length=50, unique=True, db_index=True)
    nni = models.CharField(max_length=20, unique=True, verbose_name="Numéro National d'Identité")
    
    # --- ÉTAT CIVIL ---
    nom = models.CharField(max_length=100)
    postnom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=[('M', 'Masculin'), ('F', 'Féminin')])
    date_naissance = models.DateField()
    lieu_naissance = models.CharField(max_length=255)
    groupe_sanguin = models.CharField(max_length=5, choices=[
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'), 
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-')
    ], null=True)

    # --- CARRIÈRE ---
    grade = models.CharField(max_length=100)
    echelon = models.CharField(max_length=50, blank=True)
    date_prise_fonction = models.DateField(null=True)
    date_fin_contrat = models.DateField(null=True, blank=True)
    est_officier_judiciaire = models.BooleanField(default=False)
    date_enrolement = models.DateTimeField(auto_now_add=True)
    
    # --- CONTACT ---
    telephone = models.CharField(max_length=20)
    email_professionnel = models.EmailField(unique=True)
    adresse_residence = models.TextField()
    contact_urgence_nom = models.CharField(max_length=255)
    contact_urgence_tel = models.CharField(max_length=20)

    # --- BIOMÉTRIE & SÉCURITÉ ---
    photo = models.ImageField(upload_to='agents/photos/', null=True, blank=True)
    scan_signature = models.ImageField(upload_to='agents/signatures/', null=True, blank=True)
    empreinte_digitale = models.BinaryField(null=True, blank=True)
    code_pin_securite = models.CharField(max_length=128, null=True, blank=True) 

    # --- STATUTS ---
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN POSTE')
    secteur = models.CharField(max_length=50, choices=SECTEUR_CHOICES)
    affectation = models.CharField(max_length=100) 
    est_actif = models.BooleanField(default=True)

    def __str__(self):
        return f"[{self.matricule}] {self.nom.upper()} {self.postnom}"

class Pointage(BaseAuditModel):
    STATUT_CHOICES = [
        ('PRÉSENT', 'Présent'),
        ('RETARD', 'Retard'),
        ('ABSENT', 'Absent'),
    ]
    
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='pointages')
    date_jour = models.DateField(auto_now_add=True)
    heure_arrivee = models.TimeField(null=True, blank=True)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='PRÉSENT')
    methode = models.CharField(max_length=20, default='BIOMÉTRIQUE')

    class Meta:
        unique_together = ('agent', 'date_jour')


        

from django.db import models, transaction
from django.utils import timezone
from .models import Agent, BaseAuditModel  # Assure-toi que BaseAuditModel est importé

# =================================================================
# 1. GESTION DES STOCKS (Intendance)
# =================================================================

class Article(BaseAuditModel):
    CATEGORIE_CHOICES = [
        ('Alimentation', 'Alimentation & Vivres'),
        ('Médical', 'Produits Médicaux & Pharmacie'),
        ('Équipement', 'Équipements & Uniformes'),
        ('Entretien', 'Produits d\'Entretien & Hygiène'),
        ('Sécurité', 'Matériel de Sécurité'),
    ]

    nom = models.CharField(max_length=200, unique=True, verbose_name="Désignation")
    categorie = models.CharField(max_length=50, choices=CATEGORIE_CHOICES, default='Alimentation')
    quantite = models.PositiveIntegerField(default=0, verbose_name="Quantité en stock")
    unite = models.CharField(max_length=20, help_text="Ex: Sacs, Boîtes, Unités, kg")
    seuil_alerte = models.PositiveIntegerField(default=10, help_text="Seuil critique de rupture")
    valeur_unitaire = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Valeur estimée en $")
    est_archive = models.BooleanField(default=False, verbose_name="Dans la corbeille")
    derniere_mise_a_jour = models.DateTimeField(auto_now=True) # Se mettra à jour automatiquement

    def __str__(self):
        return f"{self.nom} ({self.quantite} {self.unite})"

class MouvementStock(BaseAuditModel):
    TYPE_CHOICES = [
        ('ENTRÉE', 'Entrée (Livraison/Ajout)'),
        ('SORTIE', 'Sortie (Distribution/Retrait)'),
    ]

    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='mouvements')
    type_mouvement = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantite = models.PositiveIntegerField()
    motif = models.CharField(max_length=255, help_text="Destinataire ou Fournisseur")
    reference_document = models.CharField(max_length=100, blank=True, null=True, help_text="N° de Bon de livraison ou de sortie")
    operateur = models.CharField(max_length=100, null=True, blank=True) 

    def save(self, *args, **kwargs):
        """Met à jour le stock automatiquement lors de la création d'un mouvement."""
        with transaction.atomic():
            super().save(*args, **kwargs) # On enregistre d'abord le mouvement
            
            # Mise à jour du stock
            if self.type_mouvement == 'ENTRÉE':
                self.article.quantite += self.quantite
            else:
                self.article.quantite -= self.quantite
            self.article.save()

    def __str__(self):
        return f"{self.type_mouvement} - {self.article.nom} : {self.quantite}"

class HistoriqueArticle(BaseAuditModel):
    """Note : Avec BaseAuditModel, TraceurAudit fait déjà ce travail, mais conservé pour ton besoin spécifique."""
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='historique_modifs')
    champ = models.CharField(max_length=100) 
    ancienne_valeur = models.TextField()
    nouvelle_valeur = models.TextField()
    operateur = models.CharField(max_length=100, default='INTENDANT')

# =================================================================
# 2. GESTION DES RESSOURCES HUMAINES (Planning & Absences)
# =================================================================

class Vacation(models.TextChoices):
    MATIN = 'MATIN', 'Matin (06h-14h)'
    APRES_MIDI = 'APRES_MIDI', 'Après-midi (14h-22h)'
    NUIT = 'NUIT', 'Nuit (22h-06h)'

class Planning(BaseAuditModel):
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='plannings')
    date = models.DateField()
    vacation = models.CharField(max_length=20, choices=Vacation.choices)
    secteur_affecte = models.CharField(max_length=100) 
    est_present = models.BooleanField(default=False)

    class Meta:
        unique_together = ('agent', 'date', 'vacation')

class Absence(BaseAuditModel):
    TYPE_CHOICES = [
        ('CONGÉ', 'Congé Annuel'),
        ('MISSION', 'Mission Officielle'),
        ('RÉCUP', 'Récupération'),
        ('MALADIE', 'Repos Médical'),
    ]
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En Attente'),
        ('APPROUVÉ', 'Approuvé'),
        ('REFUSÉ', 'Refusé'),
    ]

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='absences')
    type_absence = models.CharField(max_length=20, choices=TYPE_CHOICES, default='CONGÉ')
    date_debut = models.DateField()
    date_fin = models.DateField()
    motif = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')
    date_demande = models.DateTimeField(
    default=timezone.now
)

    class Meta:
        ordering = ['-date_demande']

    def save(self, *args, **kwargs):
        # Logique métier : Si l'absence est approuvée, on met à jour le statut de l'agent
        if self.statut == 'APPROUVÉ':
            self.agent.statut = 'CONGÉ'
            self.agent.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.type_absence} - {self.agent.nom}"
    

from django.db import models, transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
import datetime

User = get_user_model()

class Deces(BaseAuditModel): # Ou AuditMixin selon ta structure
    STATUT_CHOICES = (
        ('EN_ATTENTE', 'En attente'),
        ('VALIDE', 'Validé'),
        ('ENQUETE', 'Enquête en cours'),
    )

    detenu = models.ForeignKey('Detenu', on_delete=models.CASCADE, related_name='deces_records')
    date_deces = models.DateTimeField(default=timezone.now)
    cause = models.TextField()
    declare_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='deces_declares')
    valide_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deces_valides')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')
    certificat = models.FileField(upload_to='certificats_deces/', null=True, blank=True)
    
    # 🗑️ GESTION CORBEILLE
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_deces']
        verbose_name = "Décès"

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()

    @transaction.atomic
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_statut = None
        if not is_new:
            # On récupère l'ancien statut avant la sauvegarde
            old_statut = Deces.objects.get(pk=self.pk).statut

        super().save(*args, **kwargs)

        # 🔥 LOGIQUE CRITIQUE : Si le décès est validé
        if self.statut == 'VALIDE' and old_statut != 'VALIDE':
            detenu = self.detenu
            # Mise à jour selon tes choix STATUT_CH et etat
            detenu.statut_juridique = 'MORT'
            detenu.etat = 'DECEDE'
            # On pourrait aussi désactiver un flag is_active si tu en as un
            detenu.save()

            # Notification interne pour prévenir qu'il faut appeler la famille
            self.notifier_administration()

    def notifier_administration(self):
        from .services import NotificationService
        # On notifie le validateur ou les admins
        msg = f"Décès validé: {self.detenu.nom}. Contact urgence: {self.detenu.contact_urgence_nom} ({self.detenu.contact_urgence_tel})"
        
        # On envoie à celui qui a validé
        if self.valide_par:
            NotificationService.send(
                user=self.valide_par,
                title="ALERTE : Procédure de décès",
                message=msg,
                type="DECES"
            )

    def __str__(self):
        return f"Décès de {self.detenu.matricule} ({self.statut})"


from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):

    TYPE_CHOICES = (
        ("INFO", "Info"),
        ("DECES", "Décès"),
        ("ALERTE", "Alerte"),
        ("SECURITE", "Sécurité"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()

    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="INFO")

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title