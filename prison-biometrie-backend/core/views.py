# ==========================================
# 1. PYTHON STANDARD
# ==========================================
import os
import json
import decimal
import datetime
from datetime import datetime, timedelta, date, time

# ==========================================
# 2. DJANGO CORE
# ==========================================
from django.utils import timezone
from django.db import models, transaction as db_transaction
from django.db.models import Q, Count, F, Case, When, IntegerField
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db import models, transaction 
# ==========================================
# 3. DJANGO FILTERS
# ==========================================
from django_filters.rest_framework import DjangoFilterBackend

# ==========================================
# 4. DJANGO REST FRAMEWORK
# ==========================================
from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

# ==========================================
# 5. ASYNC / CHANNELS
# ==========================================
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# ==========================================
# 6. AUTH & PERMISSIONS
# ==========================================
from users.permissions import HasDynamicPermission

# ==========================================
# 7. FACE RECOGNITION (SI UTILISÉ)
# ==========================================
import face_recognition
import numpy as np
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
from rest_framework.viewsets import ModelViewSet
from django.forms.models import model_to_dict

# ==========================================
# 8. MODELS (TOUS REGROUPÉS)
# ==========================================
from .models import (
    # Base pénitentiaire
    Detenu, Prison, Cellule, AffectationCellule,

    # Mouvement / sécurité
    MouvementExterieur, HistoriqueMouvement, JournalActivite,

    # Visites / visiteurs
    Visiteur, Watchlist,

    # Justice
    Parquet, Tribunal, DossierJudiciaire,

    # Santé / consultations
    Consultation,

    # Cantine / stock
    Article, ArticleCantine, TransactionCantine,
    MouvementStock, HistoriqueArticle,

    # Administration
    ActiviteJournaliere, RationAlimentaire, Corvee,

    # Documents
    DocumentEcrou, DocumentEcrouHistory,

    # Cellules history
    CelluleHistory,

    # Pavillon
    Pavillon, PavillonHistory,

    # Autres
    Liberation, Absence, Planning, Agent, Pointage,
    Deces
)

# ==========================================
# 9. SERIALIZERS
# ==========================================
from .serializers import (
    DetenuSerializer,
    PrisonSerializer,
    CelluleSerializer,
    AffectationCelluleSerializer,

    VisiteurSerializer,
    ConsultationSerializer,
    ConsultationHistoriqueSerializer,

    ParquetSerializer,
    ParquetSimpleSerializer,

    TribunalSerializer,

    MouvementExterieurSerializer,
    HistoriqueMouvementSerializer,

    ArticleSerializer,
    ArticleCantineSerializer,
    TransactionCantineSerializer,
    HistoriqueArticleSerializer,

    ActiviteJournaliereSerializer,
    RationAlimentaireSerializer,
    CorveeSerializer,

    DocumentEcrouSerializer,
    DocumentEcrouHistorySerializer,

    PavillonSerializer,
    PavillonHistorySerializer,

    AbsenceSerializer,
    PlanningSerializer,
    AgentSerializer,
    PointageSerializer,

    DecesSerializer,

    DetenuCantineSerializer,
    StockMedicamentSerializer,
    MedicalStatsSerializer, 
    DetenuPresenceSerializer,
    DossierJudiciaireSerializer
)







# ==========================================
# 2. VIEWSET PARQUET
# ==========================================

class ParquetViewSet(viewsets.ModelViewSet):
    permission_classes = [HasDynamicPermission]
    queryset = Parquet.objects.all().order_by('nom')

    ACTION_PERMISSION_MAP = {
        'list': 'voir_parquets',
        'retrieve': 'voir_parquets',
        'create': 'gerer_parquets',
        'update': 'gerer_parquets',
        'partial_update': 'gerer_parquets',
        'destroy': 'gerer_parquets',
    }

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ParquetSimpleSerializer
        return ParquetSerializer

    def get_permissions(self):
        self.permission_code = self.ACTION_PERMISSION_MAP.get(self.action, 'gerer_parquets')
        return super().get_permissions()

# ==========================================
# 3. VIEWSET DOSSIERS JUDICIAIRES
# ==========================================

class DossierJudiciaireViewSet(viewsets.ModelViewSet):
    permission_classes = [HasDynamicPermission]
    queryset = DossierJudiciaire.objects.all().select_related('detenu', 'parquet')
    serializer_class = DossierJudiciaireSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['detenu', 'parquet']
    search_fields = ['numero_dossier', 'prevention']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_code = 'voir_dossiers'
        else:
            self.permission_code = 'gerer_dossiers'
        return super().get_permissions()

# ==========================================
# 4. VIEWSET DOCUMENT ÉCROU
# ==========================================

class DocumentEcrouViewSet(viewsets.ModelViewSet):
    queryset = DocumentEcrou.objects.all().select_related('detenu', 'parquet_emetteur')
    serializer_class = DocumentEcrouSerializer

    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['detenu', 'type_document', 'parquet_emetteur']

    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': 'voir_documents',
        'retrieve': 'voir_documents',
        'count_alertes': 'voir_documents',
        'view_corbeille': 'voir_documents',

        'voir_historique': 'audit_documents',
        'restaurer_document': 'audit_documents',

        'create': 'gerer_documents',
        'update': 'gerer_documents',
        'partial_update': 'gerer_documents',
        'destroy': 'gerer_documents',
    }

    def get_permissions(self):
        perm = self.permission_map.get(self.action)

        if not perm:
            return [IsAuthenticated()]

        # 🔥 Injection obligatoire pour ton système
        self.permission_code = perm

        return [IsAuthenticated(), HasDynamicPermission()]

    def get_queryset(self):
        queryset = self.queryset.filter(est_archive=False)

        proche_expiration = self.request.query_params.get('proche_expiration')

        if proche_expiration == 'true':
            limite = timezone.now() + timedelta(hours=48)
            queryset = queryset.filter(
                type_document='ODP',
                date_expiration__isnull=False,
                date_expiration__lte=limite
            ).order_by('date_expiration')

        return queryset.order_by('-date_emission')

    # =========================
    # AUDIT
    # =========================
    def perform_update(self, serializer):
        instance = self.get_object()

        old_data = {
            'type_document': instance.type_document,
            'numero_document': instance.numero_document,
            'date_expiration': instance.date_expiration,
        }

        updated = serializer.save()

        for champ in old_data:
            if old_data[champ] != getattr(updated, champ):
                DocumentEcrouHistory.objects.create(
                    document=updated,
                    utilisateur=self.request.user.username,
                    action="MODIFICATION",
                    champ=champ.upper(),
                    ancienne_valeur=str(old_data[champ]),
                    nouvelle_valeur=str(getattr(updated, champ))
                )

    # =========================
    # ACTIONS
    # =========================

    @action(detail=False, methods=['get'], url_path='count-alertes')
    def count_alertes(self, request):
        limite = timezone.now() + timedelta(hours=48)

        count = DocumentEcrou.objects.filter(
            est_archive=False,
            type_document='ODP',
            date_expiration__isnull=False,
            date_expiration__lte=limite
        ).count()

        return Response({'count': count})

    @action(detail=False, methods=['get'], url_path='corbeille')
    def view_corbeille(self, request):
        docs = DocumentEcrou.objects.filter(est_archive=True).order_by('-date_archivage')
        return Response(self.get_serializer(docs, many=True).data)

    @action(detail=True, methods=['post'], url_path='restaurer')
    def restaurer_document(self, request, pk=None):
        doc = get_object_or_404(DocumentEcrou, pk=pk, est_archive=True)
        doc.est_archive = False
        doc.date_archivage = None
        doc.save()

        return Response({'status': 'Document restauré'})

    @action(detail=True, methods=['get'], url_path='historique')
    def voir_historique(self, request, pk=None):
        logs = DocumentEcrouHistory.objects.filter(document_id=pk).order_by('-date_action')
        return Response(DocumentEcrouHistorySerializer(logs, many=True).data)
# Fin ViewSets pour Dossiers avec logique métier intégrée












class CantineViewSet(viewsets.ViewSet):
    permission_classes = [HasDynamicPermission]
    
    """
    Système de gestion de la Cantine Pénitentiaire (RDC)
    Gère le pécule des détenus et la sécurité sanitaire.
    """

    def get_permissions(self):
        """Attribution des codes de permissions selon l'action"""
        if self.action in ['chercher_detenu', 'articles']:
            self.permission_code = 'consulter_cantine'
        elif self.action == 'valider_achat':
            self.permission_code = 'effectuer_achat_cantine'
        return super().get_permissions()

    # 1. RECHERCHE DYNAMIQUE
    @action(detail=False, methods=['get'])
    def chercher_detenu(self, request):
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response([])

        # On ne cherche que les détenus présents physiquement
        detenus = Detenu.objects.filter(
            Q(nom__icontains=query) | 
            Q(postnom__icontains=query) |
            Q(matricule__icontains=query)
        ).exclude(etat='ABSENT')[:10]

        serializer = DetenuCantineSerializer(detenus, many=True)
        return Response(serializer.data)

    # 2. ARTICLES DISPONIBLES
    @action(detail=False, methods=['get'])
    def articles(self, request):
        articles = ArticleCantine.objects.filter(disponible=True, stock__gt=0)
        serializer = ArticleCantineSerializer(articles, many=True)
        return Response(serializer.data)

    # 3. VALIDATION DE L'ACHAT (Transaction Sécurisée)
    @action(detail=False, methods=['post'])
    def valider_achat(self, request):
        detenu_id = request.data.get('detenu_id')
        panier = request.data.get('panier') # Liste d'objets {id, nom, prix, quantite}

        # Listes de filtrage pour la sécurité médicale
        PRODUITS_SUCRES = ['sucre', 'soda', 'jus', 'confiture', 'biscuit', 'bonbon', 'chocolat']
        PRODUITS_SALES = ['sel', 'chips', 'bouillon', 'cube', 'conserve']

        if not detenu_id or not panier:
            return Response({"error": "Panier vide ou détenu non sélectionné"}, status=400)

        try:
            # Emploi de transaction.atomic pour garantir que soit tout passe, soit tout échoue
            with db_transaction.atomic():
                # select_for_update() verrouille la ligne en BDD pour éviter les doubles débits
                detenu = Detenu.objects.select_for_update().get(id=detenu_id)

                # --- A. SÉCURITÉ MÉDICALE ---
                regime = getattr(detenu, 'regime', 'Normal')
                
                for item in panier:
                    nom_art = item['nom'].lower()
                    
                    if regime == 'Diabétique' and any(s in nom_art for s in PRODUITS_SUCRES):
                        return Response({
                            "error": f"ALERTE MÉDICALE : '{item['nom']}' interdit pour ce détenu (Diabète).",
                            "type": "MEDICAL_RESTRICTION"
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    if regime == 'Hypertendu' and any(s in nom_art for s in PRODUITS_SALES):
                        return Response({
                            "error": f"ALERTE MÉDICALE : '{item['nom']}' interdit pour ce détenu (Hypertension).",
                            "type": "MEDICAL_RESTRICTION"
                        }, status=status.HTTP_403_FORBIDDEN)

                # --- B. VÉRIFICATION FINANCIÈRE ---
                total_achat = sum(decimal.Decimal(str(item['prix'])) * int(item.get('quantite', 1)) for item in panier)

                if detenu.solde < total_achat:
                    return Response({
                        "error": f"Solde insuffisant. Pécule actuel: {detenu.solde}$"
                    }, status=status.HTTP_400_BAD_REQUEST)

                # --- C. MISE À JOUR DES STOCKS ET DÉBIT ---
                articles_a_enregistrer = []
                for item in panier:
                    art = ArticleCantine.objects.select_for_update().get(id=item.get('id'))
                    quantite_voulue = int(item.get('quantite', 1))
                    
                    if art.stock < quantite_voulue:
                        raise Exception(f"Stock insuffisant pour {art.nom} (Disponible: {art.stock})")
                    
                    art.stock -= quantite_voulue
                    art.save()
                    articles_a_enregistrer.append(f"{art.nom} x{quantite_voulue}")

                # Débit du solde
                detenu.solde -= total_achat
                detenu.save()

                # Création du log de transaction
                transaction_log = TransactionCantine.objects.create(
                    detenu=detenu,
                    total=total_achat,
                    type_transaction='ACHAT_CANTINE',
                    details=f"Articles: {', '.join(articles_a_enregistrer)}"
                )

                return Response({
                    "success": True,
                    "message": "Achat validé avec succès",
                    "nouveau_solde": float(detenu.solde),
                    "transaction_id": transaction_log.id
                }, status=status.HTTP_200_OK)

        except ArticleCantine.DoesNotExist:
            return Response({"error": "Un des articles n'existe plus en rayon."}, status=404)
        except Exception as e:
            return Response({"error": f"Échec de la transaction : {str(e)}"}, status=500)
from datetime import date


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historique_detenu(request, detenu_id):

    # 🔐 Vérification permission dynamique
    if not HasDynamicPermission().has_permission(request, None, ["historique_detenu"]):
        return Response({"error": "Accès refusé"}, status=403)

    try:
        detenu = Detenu.objects.get(id=detenu_id)

        today = date.today()
        age = today.year - detenu.date_naissance.year - (
            (today.month, today.day) < (detenu.date_naissance.month, detenu.date_naissance.day)
        )

        consultations = Consultation.objects.filter(detenu=detenu).order_by('-date_creation')
        serializer = ConsultationSerializer(consultations, many=True)

        return Response({
            "detenu": {
                "nom": f"{detenu.nom} {detenu.postnom} {detenu.prenom}",
                "matricule": detenu.matricule,
                "sexe": detenu.get_sexe_display(),
                "age": age,
                "regime": detenu.regime_alimentaire,
                "cellule_actuelle": detenu.cellule_actuelle or "N/A",
                "pavillon_actuel": detenu.pavillon_actuel or "N/A",
                "groupe_sanguin": "Non renseigné",
                "alertes": detenu.signes_particuliers or "AUCUNE ALLERGIE SIGNALÉE"
            },
            "historique": serializer.data
        }, status=status.HTTP_200_OK)

    except Detenu.DoesNotExist:
        return Response({"error": "Détenu introuvable"}, status=404)

    except Exception as e:
        print(f"Erreur historique: {str(e)}")
        return Response({"error": "Erreur interne"}, status=500)
    
class DashboardStatsView(APIView):

    permission_classes = [IsAuthenticated, HasDynamicPermission]

    permission_code = "dashboard_view"

    def get(self, request):
        total = Detenu.objects.count()

        prevenus = Detenu.objects.filter(statut_juridique='prevenu').count()
        condamnes = Detenu.objects.filter(statut_juridique='condamne').count()

        avec_bio = Detenu.objects.filter(empreinte_principale__isnull=False).count()
        couverture = (avec_bio / total * 100) if total > 0 else 0

        return Response({
            "total": total,
            "prevenus": prevenus,
            "condamnes": condamnes,
            "biometrie": round(couverture, 1)
        })




def get_client_ip(request):
    """Utilitaire pour récupérer l'adresse IP du client"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class DetenuViewSet(viewsets.ModelViewSet):

    # 🔐 BASE PERMISSIONS
    permission_classes = [IsAuthenticated, HasDynamicPermission]

    # 🔐 MAPPING DES PERMISSIONS (AJOUT IMPORTANT)
    permission_map = {
        'list': ['view_detenu'],
        'retrieve': ['view_detenu'],

        'create': ['add_detenu'],
        'update': ['change_detenu'],
        'partial_update': ['change_detenu'],

        'destroy': ['delete_detenu'],

        'corbeille': ['view_deleted_detenu'],
        'restaurer': ['restore_detenu'],
        'purger': ['purge_detenu'],
        'historique': ['view_detenu_history'],
        'update_status': ['change_detenu'],
        'liberer': ['liberate_detenu'],
    }

    queryset = Detenu.objects.all()
    serializer_class = DetenuSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]

    filterset_fields = [
        'sexe',
        'statut_juridique',
        'pavillon_actuel',
        'prison',
        'etat'
    ]

    search_fields = ['nom', 'postnom', 'prenom', 'matricule']

    # 🔐 FIX IMPORTANT (corrige ton erreur "action missing")
    def get_permissions(self):
        perms = self.permission_map.get(getattr(self, "action", None), [])

        if not perms:
            return [IsAuthenticated()]

        self.permission_code = perms[0]

        return [IsAuthenticated(), HasDynamicPermission()]

    def get_queryset(self):
        base_query = Detenu.objects.select_related('prison').all().order_by('-date_entree')

        if self.action == 'corbeille':
            return base_query.filter(est_supprime=True)

        return base_query.filter(est_supprime=False)

    # --- 1. LIBÉRATION ---
    @action(detail=True, methods=['post'], url_path='liberer')
    def liberer(self, request, pk=None):
        detenu = self.get_object()

        if detenu.statut_juridique == 'LIBERE':
            return Response(
                {'error': 'Ce détenu est déjà enregistré comme libéré.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            workflow_raw = request.data.get('workflow', '{}')
            workflow = json.loads(workflow_raw) if isinstance(workflow_raw, str) else workflow_raw

            Liberation.objects.create(
                detenu=detenu,
                motif=request.data.get('motif'),
                date_liberation=request.data.get('date_liberation'),
                autorite_ordonnante=request.data.get('autorite', ''),
                observations=request.data.get('observations', ''),
                fichier_oml=request.FILES.get('oml'),

                workflow_juridictionnelle=workflow.get('juri', False),
                workflow_parquet=workflow.get('parquet', False),
                workflow_greffe=workflow.get('greffe', False),
                workflow_restitution=workflow.get('restitution', False)
            )

            detenu.statut_juridique = 'LIBERE'
            detenu.etat = 'ABSENT'
            detenu.save()

            JournalActivite.objects.create(
                detenu=detenu,
                action='LIBERATION',
                description=f"Libération : {request.data.get('motif')}",
                utilisateur=request.user if request.user.is_authenticated else None,
                adresse_ip=get_client_ip(request)
            )

            return Response(
                {'message': "Libération validée"},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # --- 2. CORBEILLE ---
    def perform_destroy(self, instance):
        instance.est_supprime = True
        instance.date_suppression = timezone.now()
        instance.save()

        JournalActivite.objects.create(
            detenu=instance,
            action='CORBEILLE',
            description="Déplacé en corbeille",
            utilisateur=self.request.user if self.request.user.is_authenticated else None,
            adresse_ip=get_client_ip(self.request)
        )

    @action(detail=False, methods=['get'])
    def corbeille(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # --- 3. RESTAURATION ---
    @action(detail=True, methods=['post'])
    def restaurer(self, request, pk=None):
        detenu = get_object_or_404(Detenu, pk=pk)
        detenu.est_supprime = False
        detenu.date_suppression = None
        detenu.save()

        JournalActivite.objects.create(
            detenu=detenu,
            action='RESTAURATION',
            description="Restauré depuis corbeille",
            utilisateur=request.user if request.user.is_authenticated else None,
            adresse_ip=get_client_ip(request)
        )

        return Response({'message': 'Restauré avec succès'}, status=200)

    # --- 4. PURGE ---
    @action(detail=True, methods=['delete'], url_path='purger')
    def purger(self, request, pk=None):
        detenu = get_object_or_404(Detenu, pk=pk)
        detenu.delete()
        return Response({'message': 'Supprimé définitivement'}, status=204)

    # --- 5. HISTORIQUE ---
    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        detenu = self.get_object()
        activites = JournalActivite.objects.filter(detenu=detenu).order_by('-date_action')

        data = [{
            "date": a.date_action,
            "action": a.action,
            "description": a.description,
            "utilisateur": a.utilisateur.username if a.utilisateur else "Système",
            "ip": a.adresse_ip
        } for a in activites]

        return Response(data)

    # --- 6. STATUS ---
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        detenu = self.get_object()
        new_status = request.data.get('status')

        if new_status in ['PRÉSENT', 'ABSENT', 'EN ATTENTE']:
            detenu.etat = new_status
            detenu.save()

            JournalActivite.objects.create(
                detenu=detenu,
                action='PRESENCE',
                description=f"Statut : {new_status}",
                utilisateur=request.user if request.user.is_authenticated else None,
                adresse_ip=get_client_ip(request)
            )

            return Response({"message": "OK"}, status=200)

        return Response({"error": "Statut invalide"}, status=400)

#  FIN VUE 




    


class PavillonViewSet(viewsets.ModelViewSet):
    queryset = Pavillon.objects.all()
    serializer_class = PavillonSerializer

    # fallback
    permission_classes = [IsAuthenticated]

    # 🔐 Mapping des permissions par action
    permission_map = {
        'list': ['view_pavillon'],
        'retrieve': ['view_pavillon'],
        'historique': ['view_pavillon_history'],
        'corbeille': ['view_deleted_pavillon'],

        'create': ['add_pavillon'],
        'update': ['change_pavillon'],
        'partial_update': ['change_pavillon'],

        'destroy': ['delete_pavillon'],
        'restaurer': ['restore_pavillon'],
    }

    def get_permissions(self):
        """
        Permissions dynamiques compatibles avec HasDynamicPermission
        """
        perms = self.permission_map.get(self.action, [])

        # Si aucune permission spécifique → seulement auth
        if not perms:
            return [IsAuthenticated()]

        # 🔥 Injection dynamique (clé de ton système)
        self.permission_code = perms[0]

        return [IsAuthenticated(), HasDynamicPermission()]

    def get_queryset(self):
        return Pavillon.objects.filter(is_deleted=False)

    # --- SUPPRESSION LOGIQUE (CORBEILLE) ---
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()

        return Response(
            {"message": "Pavillon déplacé dans la corbeille"},
            status=status.HTTP_204_NO_CONTENT
        )

    # --- UPDATE AVEC HISTORIQUE ---
    def perform_update(self, serializer):
        instance = self.get_object()

        ancien_etat = {
            "nom": instance.nom,
            "type_zone": instance.type_zone,
            "description": instance.description
        }

        updated_instance = serializer.save()

        PavillonHistory.objects.create(
            pavillon=updated_instance,
            modifie_par=self.request.user if self.request.user.is_authenticated else None,
            etat_ancien=ancien_etat,
            etat_actuel=serializer.data,
            action="MODIFICATION"
        )

    # --- ACTIONS SPÉCIALES ---

    @action(detail=False, methods=['get'])
    def corbeille(self, request):
        pavillons = Pavillon.objects.filter(is_deleted=True)
        serializer = self.get_serializer(pavillons, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restaurer(self, request, pk=None):
        pavillon = Pavillon.objects.get(pk=pk)
        pavillon.is_deleted = False
        pavillon.save()

        PavillonHistory.objects.create(
            pavillon=pavillon,
            modifie_par=request.user if request.user.is_authenticated else None,
            etat_ancien={"is_deleted": True},
            etat_actuel={"is_deleted": False},
            action="RESTAURATION"
        )

        return Response({"message": "Pavillon restauré avec succès"})

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        pavillon = self.get_object()
        history = pavillon.history.all()
        serializer = PavillonHistorySerializer(history, many=True)
        return Response(serializer.data)



        

# =========================================================
# CELLULE VIEWSET
# =========================================================
class CelluleViewSet(viewsets.ModelViewSet):
    serializer_class = CelluleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['pavillon']

    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': ['view_cellule'],
        'retrieve': ['view_cellule'],
        'voir_historique': ['view_cellule_history'],
        'get_corbeille': ['view_deleted_cellule'],

        'create': ['add_cellule'],
        'update': ['change_cellule'],
        'partial_update': ['change_cellule'],

        'destroy': ['delete_cellule'],
        'restaurer_cellule': ['restore_cellule'],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])

        if not perms:
            return [IsAuthenticated()]

        # 🔥 Injection dynamique compatible avec ton système
        self.permission_code = perms[0]

        return [IsAuthenticated(), HasDynamicPermission()]

    def get_queryset(self):
        return Cellule.objects.filter(is_deleted=False).order_by('numero')

    # --- AUDIT TRAIL ---
    def perform_update(self, serializer):
        instance = self.get_object()

        ancien_etat = {
            "numero": instance.numero,
            "capacite": instance.capacite_max,
            "pavillon": instance.pavillon.nom
        }

        updated_instance = serializer.save()

        CelluleHistory.objects.create(
            cellule=updated_instance,
            modifie_par=self.request.user if self.request.user.is_authenticated else None,
            etat_ancien=ancien_etat,
            etat_actuel=serializer.data,
            action="MODIFICATION_TECHNIQUE"
        )

    # --- SOFT DELETE ---
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()

        return Response(
            {"message": "Cellule transférée à la corbeille"},
            status=status.HTTP_204_NO_CONTENT
        )

    # --- CORBEILLE ---
    @action(detail=False, methods=['get'], url_path='corbeille')
    def get_corbeille(self, request):
        deleted_cells = Cellule.objects.filter(is_deleted=True)

        pavillon_id = request.query_params.get('pavillon')
        if pavillon_id:
            deleted_cells = deleted_cells.filter(pavillon_id=pavillon_id)

        serializer = self.get_serializer(deleted_cells, many=True)
        return Response(serializer.data)

    # --- RESTAURATION ---
    @action(detail=True, methods=['post'], url_path='restaurer')
    def restaurer_cellule(self, request, pk=None):
        cellule = Cellule.objects.get(pk=pk, is_deleted=True)
        cellule.is_deleted = False
        cellule.save()

        return Response({"status": "Cellule réactivée"}, status=status.HTTP_200_OK)

    # --- HISTORIQUE ---
    @action(detail=True, methods=['get'], url_path='historique')
    def voir_historique(self, request, pk=None):
        logs = CelluleHistory.objects.filter(cellule_id=pk).order_by('-date_modification')
        return Response(logs.values())


# =========================================================
# AFFECTATION CELLULE VIEWSET
# =========================================================
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import AffectationCellule
from .serializers import (
    AffectationCelluleSerializer,
    AffectationCelluleHistorySerializer
)




class AffectationCelluleViewSet(viewsets.ModelViewSet):
    serializer_class = AffectationCelluleSerializer
    queryset = AffectationCellule.objects.filter(is_deleted=False)\
        .select_related('detenu', 'cellule__pavillon')\
        .order_by('-date_entree')

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['detenu', 'cellule']

    permission_classes = [IsAuthenticated, HasDynamicPermission]

    permission_map = {
        'list': 'view_affectation_cellule',
        'retrieve': 'view_affectation_cellule',
        'historique': 'view_affectation_cellule_history',
        'corbeille': 'view_deleted_affectation_cellule',

        'create': 'add_affectation_cellule',
        'update': 'change_affectation_cellule',
        'partial_update': 'change_affectation_cellule',

        'destroy': 'delete_affectation_cellule',
        'restaurer': 'restore_affectation_cellule',
    }

    def get_permissions(self):
        self.permission_code = self.permission_map.get(self.action)
        return [permission() for permission in self.permission_classes]

    # ---------------------------
    # SOFT DELETE
    # ---------------------------
    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()

    # ---------------------------
    # HISTORIQUE
    # ---------------------------
    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        instance = self.get_object()

        logs = instance.logs.all().select_related('modifie_par')

        serializer = AffectationCelluleHistorySerializer(logs, many=True)
        return Response(serializer.data)

    # ---------------------------
    # CORBEILLE
    # ---------------------------
    @action(detail=False, methods=['get'])
    def corbeille(self, request):
        deleted_queryset = AffectationCellule.objects.filter(is_deleted=True)\
            .select_related('detenu', 'cellule__pavillon')\
            .order_by('-date_entree')

        serializer = self.get_serializer(deleted_queryset, many=True)
        return Response(serializer.data)

    # ---------------------------
    # RESTAURATION
    # ---------------------------
    @action(detail=True, methods=['post'])
    def restaurer(self, request, pk=None):
        try:
            instance = AffectationCellule.objects.get(pk=pk, is_deleted=True)

            instance.is_deleted = False
            instance.save()

            return Response(
                {'status': 'Restauration effectuée'},
                status=status.HTTP_200_OK
            )

        except AffectationCellule.DoesNotExist:
            return Response(
                {'error': 'Élément introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )



class TribunalViewSet(viewsets.ModelViewSet):
    queryset = Tribunal.objects.all().order_by('nom')
    serializer_class = TribunalSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom', 'ville', 'type_juridiction']

    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': ['view_tribunal'],
        'retrieve': ['view_tribunal'],
        'create': ['add_tribunal'],
        'update': ['change_tribunal'],
        'partial_update': ['change_tribunal'],
        'destroy': ['delete_tribunal'],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])

        if not perms:
            return [IsAuthenticated()]

        # 🔥 Injection dynamique
        self.permission_code = perms[0]

        return [IsAuthenticated(), HasDynamicPermission()]









class MouvementExterieurViewSet(viewsets.ModelViewSet):
    serializer_class = MouvementExterieurSerializer
    queryset = MouvementExterieur.objects.all()

    # 🔐 Base obligatoire
    permission_classes = [IsAuthenticated]

    # 🔐 Mapping des permissions
    permission_map = {
        # 🔍 Lecture
        'list': ['view_mouvement'],
        'retrieve': ['view_mouvement'],
        'actifs': ['view_mouvement'],
        'historique': ['view_mouvement_history'],
        'corbeille': ['view_deleted_mouvement'],

        # ✏️ CRUD
        'create': ['add_mouvement'],
        'update': ['change_mouvement'],
        'partial_update': ['change_mouvement'],
        'destroy': ['delete_mouvement'],
        'restaurer': ['restore_mouvement'],

        # ⚙️ Métier
        'verifier_detenu': ['view_detenu'],
        'enregistrer_sortie': ['add_mouvement'],
        'retour': ['change_mouvement'],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])

        if not perms:
            return [IsAuthenticated()]

        # 🔥 Injection dynamique
        self.permission_code = perms[0]

        return [IsAuthenticated(), HasDynamicPermission()]

    def get_queryset(self):
        return MouvementExterieur.objects.filter(is_deleted=False).order_by('-heure_sortie')

    # --- UTILITAIRE : CAPTURE D'ÉTAT ---
    def capture_etat(self, instance):
        data = model_to_dict(instance)

        if data.get('heure_sortie'):
            data['heure_sortie'] = data['heure_sortie'].isoformat()

        if data.get('heure_retour'):
            data['heure_retour'] = data['heure_retour'].isoformat()

        return data

    # --- UPDATE AVEC HISTORIQUE ---
    def perform_update(self, serializer):
        instance = self.get_object()
        etat_ancien = self.capture_etat(instance)

        updated_instance = serializer.save()
        etat_actuel = self.capture_etat(updated_instance)

        HistoriqueMouvement.objects.create(
            mouvement=updated_instance,
            action='UPDATE',
            modifie_par=self.request.user if self.request.user.is_authenticated else None,
            etat_ancien=etat_ancien,
            etat_actuel=etat_actuel
        )

    # --- SOFT DELETE ---
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        etat_avant = self.capture_etat(instance)

        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()

        HistoriqueMouvement.objects.create(
            mouvement=instance,
            action='DELETE',
            modifie_par=request.user if request.user.is_authenticated else None,
            etat_ancien=etat_avant,
            etat_actuel={'status': 'TRANSFÉRÉ EN CORBEILLE'}
        )

        return Response(
            {"message": "Mouvement archivé avec succès."},
            status=status.HTTP_200_OK
        )

    # --- MOUVEMENTS ACTIFS ---
    @action(detail=False, methods=['get'], url_path='mouvements-actifs')
    def actifs(self, request):
        actifs = self.get_queryset().filter(statut='HORS MURS')
        serializer = self.get_serializer(actifs, many=True)
        return Response(serializer.data)

    # --- CORBEILLE ---
    @action(detail=False, methods=['get'], url_path='corbeille')
    def corbeille(self, request):
        supprimes = MouvementExterieur.objects.filter(is_deleted=True).order_by('-deleted_at')
        serializer = self.get_serializer(supprimes, many=True)
        return Response(serializer.data)

    # --- RESTAURATION ---
    @action(detail=True, methods=['post'], url_path='restaurer')
    def restaurer(self, request, pk=None):
        try:
            instance = MouvementExterieur.objects.get(pk=pk, is_deleted=True)

            instance.is_deleted = False
            instance.deleted_at = None
            instance.save()

            HistoriqueMouvement.objects.create(
                mouvement=instance,
                action='RESTORE',
                modifie_par=request.user if request.user.is_authenticated else None,
                etat_actuel=self.capture_etat(instance)
            )

            return Response({"message": "Restauration effectuée."}, status=status.HTTP_200_OK)

        except MouvementExterieur.DoesNotExist:
            return Response({"error": "Mouvement introuvable dans la corbeille."}, status=404)

    # --- HISTORIQUE ---
    @action(detail=True, methods=['get'], url_path='historique')
    def historique(self, request, pk=None):
        instance = self.get_object()
        logs = instance.logs.all().order_by('-date_modification')
        serializer = HistoriqueMouvementSerializer(logs, many=True)
        return Response(serializer.data)

    # --- VERIFIER DETENU ---
    @action(detail=False, methods=['post'], url_path='verifier-detenu')
    def verifier_detenu(self, request):
        matricule = request.data.get('matricule')

        try:
            detenu = Detenu.objects.get(matricule=matricule)

            return Response({
                "id": detenu.id,
                "nom": detenu.nom,
                "postnom": detenu.postnom,
                "prenom": detenu.prenom,
                "matricule": detenu.matricule,
                "photo": request.build_absolute_uri(detenu.photo.url) if detenu.photo else None
            })

        except Detenu.DoesNotExist:
            return Response({"error": "Matricule inconnu."}, status=404)

    # --- SORTIE ---
    @action(detail=False, methods=['post'], url_path='enregistrer-sortie')
    def enregistrer_sortie(self, request):
        matricule = request.data.get('matricule')

        try:
            detenu = Detenu.objects.get(matricule=matricule)
        except Detenu.DoesNotExist:
            return Response({"error": "Détenu introuvable."}, status=404)

        if MouvementExterieur.objects.filter(
            detenu=detenu,
            statut='HORS MURS',
            is_deleted=False
        ).exists():
            return Response({"error": "Ce détenu est déjà à l'extérieur."}, status=400)

        data = request.data.copy()
        data['detenu'] = detenu.id

        if 'motif' in data:
            data['motif_details'] = data['motif']

        serializer = self.get_serializer(data=data)

        if serializer.is_valid():
            mouvement = serializer.save()

            HistoriqueMouvement.objects.create(
                mouvement=mouvement,
                action='CREATE',
                modifie_par=request.user if request.user.is_authenticated else None,
                etat_actuel=self.capture_etat(mouvement)
            )

            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

    # --- RETOUR ---
    @action(detail=True, methods=['post'])
    def retour(self, request, pk=None):
        mouvement = self.get_object()

        if mouvement.statut == 'RETOURNE':
            return Response({"error": "Déjà réintégré."}, status=400)

        mouvement.statut = 'RETOURNE'
        mouvement.heure_retour = timezone.now()
        mouvement.save()

        HistoriqueMouvement.objects.create(
            mouvement=mouvement,
            action='UPDATE',
            modifie_par=request.user if request.user.is_authenticated else None,
            etat_actuel=self.capture_etat(mouvement)
        )

        return Response({"message": "Réintégration réussie."})











    
from rest_framework.permissions import IsAuthenticated

class PrisonViewSet(viewsets.ModelViewSet):
    queryset = Prison.objects.all()
    serializer_class = PrisonSerializer

    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': ['view_prison'],
        'retrieve': ['view_prison'],
        'create': ['add_prison'],
        'update': ['change_prison'],
        'partial_update': ['change_prison'],
        'destroy': ['delete_prison'],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])

        if not perms:
            return [IsAuthenticated()]

        # 🔥 Injection dynamique
        self.permission_code = perms[0]

        return [IsAuthenticated(), HasDynamicPermission()]





class VieCarceraleAPIView(APIView):

    # 🔐 Base obligatoire
    permission_classes = [IsAuthenticated]

    # 🔐 Permissions pour APIView (PAS action, mais METHOD)
    permission_map = {
        'GET': ['view_vie_carcerale'],
    }

    def get_permissions(self):
        method = self.request.method  # ✅ FIX IMPORTANT

        perms = self.permission_map.get(method)

        base_permissions = [IsAuthenticated()]

        if not perms:
            return base_permissions

        # 🔥 injection propre pour ton système dynamique
        self.permission_code = perms

        return base_permissions + [HasDynamicPermission()]

    def get(self, request):
        maintenant = datetime.now()
        heure_actuelle = maintenant.time()

        # 1. PLANNING
        planning_queryset = ActiviteJournaliere.objects.all().order_by('heure_debut')

        planning_data = []

        for act in planning_queryset:
            is_active = act.heure_debut <= heure_actuelle <= act.heure_fin

            fin_dt = datetime.combine(datetime.today(), act.heure_fin)
            diff = fin_dt - maintenant
            minutes_restantes = max(0, int(diff.total_seconds() / 60)) if is_active else 0

            planning_data.append({
                "id": act.id,
                "label": act.label,
                "heure_debut": act.heure_debut.strftime("%H:%M"),
                "heure_fin": act.heure_fin.strftime("%H:%M"),
                "type_activite": act.type_activite,
                "nb_detenus_prevus": act.nb_detenus_prevus,
                "est_actuelle": is_active,
                "minutes_restantes": minutes_restantes
            })

        # 2. CANTINE
        try:
            ration = RationAlimentaire.objects.filter(date=datetime.today()).latest('id')

            cantine_data = {
                "repas_actuel": ration.get_repas_display(),
                "servis": ration.total_servi,
                "total": ration.total_attendu,
                "percent": round(
                    (ration.total_servi / ration.total_attendu * 100), 1
                ) if ration.total_attendu > 0 else 0
            }

        except RationAlimentaire.DoesNotExist:
            cantine_data = {
                "repas_actuel": "Aucun service",
                "servis": 0,
                "total": 0,
                "percent": 0
            }

        # 3. CORVÉES
        corvees = Corvee.objects.all()

        corvees_data = [{
            "id": c.id,
            "label": c.label,
            "statut": c.statut,
            "responsable": c.responsable_equipe,
            "equipe": [
                d.nom[0].upper() + (d.prenom[0].upper() if d.prenom else "")
                for d in c.detenus_assignes.all()[:5]
            ]
        } for c in corvees]

        return Response({
            "planning": planning_data,
            "cantine": cantine_data,
            "corvees": corvees_data,
            "server_time": maintenant.strftime("%H:%M:%S")
        })

def check_permission(request, permission_code):
    if not HasDynamicPermission().has_permission(request, type('obj', (), {'permission_code': permission_code})):
        return False
    return True

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_presence_list(request):

    if not check_permission(request, "view_detenu_presence"):
        return Response({"error": "Accès refusé"}, status=403)

    detenus = Detenu.objects.all().order_by('nom')
    serializer = DetenuPresenceSerializer(detenus, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_presence(request, detenu_id):

    if not check_permission(request, "change_detenu_presence"):
        return Response({"error": "Accès refusé"}, status=403)

    try:
        detenu = Detenu.objects.get(pk=detenu_id)
        new_status = request.data.get('status')

        valides = ['PRÉSENT', 'ABSENT', 'EN ATTENTE']

        if new_status in valides:
            detenu.etat = new_status
            detenu.save()

            return Response({
                "status": "success",
                "message": f"Statut mis à jour : {new_status}",
                "id": detenu.id,
                "etat": detenu.etat
            })

        return Response({"error": "Statut invalide"}, status=400)

    except Detenu.DoesNotExist:
        return Response({"error": "Détenu non trouvé"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liste_mouvements(request):

    if not check_permission(request, "view_mouvement_list"):
        return Response({"error": "Accès refusé"}, status=403)

    mouvements = MouvementExterieur.objects.filter(
        heure_sortie__date=timezone.now().date()
    )

    serializer = MouvementExterieurSerializer(mouvements, many=True)
    return Response(serializer.data)

# 2. Enregistrer une nouvelle sortie (POST)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enregistrer_sortie(request):

    if not check_permission(request, "add_mouvement_entrer_sortie"):
        return Response({"error": "Accès refusé"}, status=403)

    try:
        detenu = Detenu.objects.get(matricule=request.data.get('matricule'))

        mouvement = MouvementExterieur.objects.create(
            detenu=detenu,
            destination=request.data.get('destination'),
            motif=request.data.get('motif'),
            escorte=request.data.get('escorte')
        )

        mouvement.refresh_from_db()

        serializer = MouvementExterieurSerializer(mouvement)
        return Response(serializer.data, status=201)

    except Detenu.DoesNotExist:
        return Response({"error": "Détenu introuvable"}, status=404)

# 3. Pointer le retour (POST)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pointer_retour(request, pk):

    if not check_permission(request, "change_mouvement_entrer_sortie"):
        return Response({"error": "Accès refusé"}, status=403)

    try:
        mouvement = MouvementExterieur.objects.get(pk=pk)

        mouvement.statut = 'RETOURNE'
        mouvement.heure_retour = timezone.now()
        mouvement.save()

        return Response({"status": "success"})

    except MouvementExterieur.DoesNotExist:
        return Response({"error": "Introuvable"}, status=404)






class ConsultationViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': ['view_consultation'],
        'retrieve': ['view_consultation'],
        'create': ['add_consultation'],
        'update': ['change_consultation'],
        'partial_update': ['change_consultation'],
        'destroy': ['delete_consultation'],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])

        if not perms:
            return [IsAuthenticated()]

        self.permission_code = perms[0]
        return [IsAuthenticated(), HasDynamicPermission()]

    def get_queryset(self):
        return Consultation.objects.all().annotate(
            priorite_poids=Case(
                When(priorite='URGENT', then=1),
                When(priorite='HAUTE', then=2),
                When(priorite='NORMALE', then=3),
                default=4,
                output_field=IntegerField(),
            )
        ).order_by('priorite_poids', '-date_creation')
    

# 2. Vue pour les statistiques du Dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def medical_dashboard_stats(request):

    if not check_permission(request, "view_consultation_dashboard"):
        return Response({"error": "Accès refusé"}, status=403)

    today = timezone.now().date()
    qs = Consultation.objects.filter(date_creation__date=today)

    total = qs.count()
    traites = qs.filter(statut='TRAITÉ').count()
    urgences = qs.filter(priorite='URGENT').exclude(statut='TRAITÉ').count()

    return Response({
        "total_jour": total,
        "traites_jour": traites,
        "urgences_actives": urgences,
        "pourcentage": round((traites / total * 100), 1) if total > 0 else 0
    })

# 3. Vue pour changer le statut (Appelée par le select en React)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_consultation_status(request, pk):

    if not check_permission(request, "change_consultation"):
        return Response({"error": "Accès refusé"}, status=403)

    try:
        consultation = Consultation.objects.get(pk=pk)
        statut = request.data.get('statut')

        valeurs = [v[0] for v in Consultation.STATUTS]

        if statut in valeurs:
            consultation.statut = statut
            consultation.save()

            return Response({"status": "success"})

        return Response({"error": "Statut invalide"}, status=400)

    except Consultation.DoesNotExist:
        return Response({"error": "Introuvable"}, status=404)





# =========================================================
# PARQUET VIEWSET
# =========================================================
class ParquetViewSet(viewsets.ModelViewSet):

    queryset = Parquet.objects.all().order_by('nom')

    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': ['view_parquet'],
        'retrieve': ['view_parquet'],

        'create': ['add_parquet'],
        'update': ['change_parquet'],
        'partial_update': ['change_parquet'],

        'destroy': ['delete_parquet'],
    }

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ParquetSimpleSerializer
        return ParquetSerializer

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])

        if not perms:
            return [IsAuthenticated()]

        # 🔥 Injection dynamique
        self.permission_code = perms[0]

        return [IsAuthenticated(), HasDynamicPermission()]

# =========================================================
# VISITEUR VIEWSET
# =========================================================
class VisiteurViewSet(viewsets.ModelViewSet):

    queryset = Visiteur.objects.all().order_by('-heure_entree')
    serializer_class = VisiteurSerializer

    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': ['view_visiteur'],
        'retrieve': ['view_visiteur'],

        'create': ['add_visiteur'],
        'update': ['change_visiteur'],
        'partial_update': ['change_visiteur'],
        'destroy': ['delete_visiteur'],

        # actions
        'valider_entree': ['control_visiteur'],
        'enregistrer_sortie': ['control_visiteur'],
        'analyse_strategique': ['view_stats_visiteur'],
        'rechercher_detenu': ['view_detenu'],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])
        base = [IsAuthenticated()]

        # Aucun permission dynamique
        if not perms:
            return base

        # ✅ FIX ICI : on ne passe PLUS de paramètres au constructeur
        perm_instance = HasDynamicPermission()
        perm_instance.required_permissions = perms  # ou perms selon ton class

        return base + [perm_instance]

    # =========================================================
    # FILTRE PAR DATE
    # =========================================================
    def get_queryset(self):
        queryset = Visiteur.objects.all()
        date_param = self.request.query_params.get('date')

        if date_param:
            queryset = queryset.filter(heure_entree__date=date_param)

        return queryset

    # =========================================================
    # CREATE (INTELLIGENCE)
    # =========================================================
    def create(self, request, *args, **kwargs):
        data = request.data
        nom = data.get('nom_complet')
        piece_no = data.get('piece_identite_numero')

        en_watchlist = Watchlist.objects.filter(
            Q(nom_complet__iexact=nom) |
            Q(numero_piece_identite=piece_no)
        ).first()

        un_mois_ago = timezone.now() - timedelta(days=30)

        nb_connexions = Visiteur.objects.filter(
            piece_identite_numero=piece_no,
            heure_entree__gte=un_mois_ago
        ).values('detenu_visite').distinct().count()

        alerte = False
        notes = ""

        if en_watchlist:
            alerte = True
            notes = f"ALERTE WATCHLIST: {en_watchlist.motif}"

            if en_watchlist.niveau_danger == 'ROUGE':
                return Response(
                    {"error": "Accès refusé"},
                    status=status.HTTP_403_FORBIDDEN
                )

        if nb_connexions >= 3 and data.get('type_visiteur') != 'AVOCAT':
            alerte = True
            notes += f" | SUSPICION RÉSEAU"

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        visite = serializer.save(
            alerte_securite=alerte,
            notes_renseignement=notes
        )

        return Response({
            "id": visite.id,
            "token": visite.token or f"VZ-{visite.id + 1000}",
            "alerte": alerte
        }, status=status.HTTP_201_CREATED)

    # =========================================================
    # GET OBJECT
    # =========================================================
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get('pk')

        clean_token = str(lookup_value).replace("VISIT-", "").strip()

        query = Q(token__iexact=lookup_value) | Q(token__iexact=clean_token)

        if str(lookup_value).isdigit():
            query |= Q(pk=lookup_value)

        obj = queryset.filter(query).first()

        if not obj:
            raise Http404("Visiteur introuvable")

        return obj

    # =========================================================
    # VALIDER ENTREE
    # =========================================================
    @action(detail=True, methods=['patch', 'get'])
    def valider_entree(self, request, pk=None):
        visiteur = self.get_object()

        if request.method == 'GET':
            return Response({"visiteur": visiteur.nom_complet})

        decision = request.data.get('statut')

        if decision == 'REFUSE':
            visiteur.statut = 'REFUSE'
        else:
            visiteur.statut = 'EN PARLOIR'
            visiteur.heure_entree = timezone.now()

        visiteur.save()
        return Response(self.get_serializer(visiteur).data)

    # =========================================================
    # SORTIE
    # =========================================================
    @action(detail=True, methods=['post'])
    def enregistrer_sortie(self, request, pk=None):
        visiteur = self.get_object()

        if visiteur.statut == 'TERMINE':
            return Response({'error': 'Déjà sorti'}, status=400)

        visiteur.heure_sortie = timezone.now()
        visiteur.statut = 'TERMINE'
        visiteur.save()

        return Response({'message': 'Sortie validée'})

    # =========================================================
    # ANALYSE
    # =========================================================
    @action(detail=False, methods=['get'])
    def analyse_strategique(self, request):
        stats = Visiteur.objects.values('detenu_visite__nom') \
            .annotate(total=Count('id')) \
            .order_by('-total')[:10]

        return Response(stats)

    # =========================================================
    # SEARCH DETENU
    # =========================================================
    @action(detail=False, methods=['get'])
    def rechercher_detenu(self, request):
        query = request.query_params.get('q', '')

        if len(query) < 2:
            return Response([])

        detenus = Detenu.objects.filter(
            Q(nom__icontains=query) |
            Q(matricule__icontains=query)
        )[:10]

        data = [{
            "id": d.id,
            "label": f"{d.matricule} - {d.nom.upper()}",
            "photo": request.build_absolute_uri(d.photo.url) if d.photo else None
        } for d in detenus]

        return Response(data)




# ==========================================
# 1. CLÔTURE PAR SCAN QR
# ==========================================
@api_view(['POST'])
@permission_classes([IsAuthenticated, HasDynamicPermission])
def cloturer_visite_scan(request):
    """
    Clôture via QR code (numéro de pièce)
    Payload : { "qr_value": "12345ABC" }
    """

    # 🔐 permission dynamique
    cloturer_visite_scan.permission_code = "control_visiteur"

    qr_data = request.data.get('qr_value')

    if not qr_data:
        return Response(
            {"error": "Données du scan manquantes"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        visite = Visiteur.objects.filter(
            piece_identite_numero=qr_data,
            statut='EN PARLOIR'
        ).latest('heure_entree')

        visite.heure_sortie = timezone.now()
        visite.statut = 'TERMINE'
        visite.save()

        return Response({
            "status": "success",
            "message": f"Visite de {visite.nom_complet} clôturée avec succès.",
            "nom": visite.nom_complet,
            "heure_sortie": visite.heure_sortie.strftime("%H:%M")
        }, status=status.HTTP_200_OK)

    except Visiteur.DoesNotExist:
        return Response({
            "error": "Aucune visite en cours trouvée pour ce document."
        }, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# 2. CLÔTURE MANUELLE (SECOURS)
# ==========================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, HasDynamicPermission])
def cloturer_visite(request, pk):
    """
    Clôture via ID (manuel)
    """

    # 🔐 permission dynamique
    cloturer_visite.permission_code = "control_visiteur"

    try:
        visite = Visiteur.objects.get(pk=pk)

        visite.heure_sortie = timezone.now()
        visite.statut = 'TERMINE'
        visite.save()

        return Response({
            "status": "success",
            "message": "Visite clôturée avec succès",
            "token": visite.token
        }, status=status.HTTP_200_OK)

    except Visiteur.DoesNotExist:
        return Response(
            {"error": "Visite non trouvée"},
            status=status.HTTP_404_NOT_FOUND
        )

class IntelligenceDashboardAPI(APIView):

    permission_classes = [HasDynamicPermission]
    permission_code = "dashboard_intelligence_view"

    def get_permissions(self):
        # 🔐 injection dynamique obligatoire pour ton système
        self.permission_code = "dashboard_intelligence_view"
        return [HasDynamicPermission()]

    def get(self, request):
        # Utilisation de timezone.now() pour la compatibilité Django
        now_dt = timezone.now()
        today = now_dt.date()

        # CORRECTION ICI : On utilise timedelta directement
        last_30_days = today - timedelta(days=30)

        # --- 1. STATS GLOBALES ---
        visiteurs_jour = Visiteur.objects.filter(heure_entree__date=today)
        stats = {
            "totalVisiteursJour": visiteurs_jour.count(),
            "alertesWatchlist": visiteurs_jour.filter(alerte_securite=True).count(),
            "visitesEnCours": visiteurs_jour.filter(statut='EN PARLOIR').count(),
        }

        # --- 2. FLUX HEBDOMADAIRE ---
        flux_hebdo = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = Visiteur.objects.filter(heure_entree__date=day).count()
            flux_hebdo.append({
                "jour": day.strftime('%a'),
                "visiteurs": count
            })

        # --- 3. RÉPARTITION PAR TYPE ---
        repartition = Visiteur.objects.filter(
            heure_entree__date__gte=last_30_days
        ).values('type_visiteur').annotate(value=Count('id'))

        type_dict = dict(Visiteur.TYPE_CHOICES)

        repartition_motifs = [
            {
                "name": type_dict.get(r['type_visiteur'], r['type_visiteur']),
                "value": r['value']
            }
            for r in repartition
        ]

        # --- 4. TOP CIBLES ---
        top_detenus_query = Detenu.objects.annotate(
            nb_visites=Count(
                'visites',
                filter=Q(visites__heure_entree__date__gte=last_30_days)
            )
        ).filter(nb_visites__gt=0).order_by('-nb_visites')[:5]

        top_cibles = [
            {
                "matricule": d.matricule,
                "visites": d.nb_visites,
                "pavillon": d.pavillon_actuel or "Zone A"
            }
            for d in top_detenus_query
        ]

        # --- 5. MATRICE D'INTELLIGENCE ---
        dernieres_visites_raw = Visiteur.objects.select_related(
            'detenu_visite'
        ).order_by('-heure_entree')[:15]

        intelligence_data = []

        for v in dernieres_visites_raw:

            # Intelligence croisée
            freq_cible = Visiteur.objects.filter(
                nom_complet=v.nom_complet,
                detenu_visite=v.detenu_visite,
                heure_entree__date__gte=last_30_days
            ).count()

            vol_mois = Visiteur.objects.filter(
                nom_complet=v.nom_complet,
                heure_entree__date__gte=last_30_days
            ).count()

            historique_query = Visiteur.objects.filter(
                nom_complet=v.nom_complet
            ).select_related('detenu_visite').order_by('-heure_entree')[:5]

            historique_reel = [
                {
                    "date": h.heure_entree.strftime("%d/%m/%Y à %H:%M"),
                    "detenu": h.detenu_visite.matricule if h.detenu_visite else "Inconnu",
                    "statut": h.get_statut_display(),
                    "motif": h.get_type_visiteur_display()
                }
                for h in historique_query
            ]

            # Analyse du risque
            risque = "FAIBLE"
            if v.alerte_securite or (hasattr(v, 'niveau_alerte') and v.niveau_alerte > 2):
                risque = "CRITIQUE"
            elif freq_cible >= 3:
                risque = "MODÉRÉ"

            # Données détenu
            nom_detenu = "N/A"
            pavillon = "N/A"
            cellule = "N/A"

            if v.detenu_visite:
                d = v.detenu_visite
                nom_detenu = f"{d.nom} {d.postnom} {d.prenom}".strip()
                pavillon = d.pavillon_actuel or "N/A"
                cellule = d.cellule_actuelle or "N/A"

            # CORRECTION PHOTO
            photo_url = None
            if hasattr(v, 'photo_capturee') and v.photo_capturee:
                if hasattr(v.photo_capturee, 'url'):
                    photo_url = v.photo_capturee.url
                elif isinstance(v.photo_capturee, str):
                    photo_url = v.photo_capturee

            intelligence_data.append({
                "id": v.id,
                "token": v.token,
                "nom": v.nom_complet,
                "type": v.get_type_visiteur_display(),
                "statut": v.statut,
                "detenu": nom_detenu,
                "pavillon": pavillon,
                "cellule": cellule,
                "heure": v.heure_entree.strftime("%H:%M"),
                "heure_entree_iso": v.heure_entree.isoformat(),
                "nbVisitesCeMois": vol_mois,
                "frequenceDetenu": freq_cible,
                "risque": risque,
                "alerte": v.alerte_securite,
                "qr_code_value": v.piece_identite_numero or v.token,
                "id_document": v.piece_identite_numero or f"REF-{v.id}",
                "photo_url": photo_url,
                "historique": historique_reel,
                "notes": getattr(v, 'notes_renseignement', ""),
                "effets_consignes": getattr(v, 'effets_consignes', None)
            })

        return Response({
            "stats": stats,
            "fluxHebdo": flux_hebdo,
            "repartitionMotifs": repartition_motifs,
            "topCibles": top_cibles,
            "intelligenceData": intelligence_data
        })
    




class AbsenceViewSet(viewsets.ModelViewSet):

    permission_classes = [HasDynamicPermission]

    queryset = Absence.objects.all().order_by('-date_demande')
    serializer_class = AbsenceSerializer

    # 🔐 Mapping permissions
    permission_map = {
        "list": ["view_absence"],
        "retrieve": ["view_absence"],

        "create": ["add_absence"],
        "update": ["change_absence"],
        "partial_update": ["change_absence"],

        "destroy": ["delete_absence"],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])

        if not perms:
            self.permission_code = "view_absence"
            return [HasDynamicPermission()]

        self.permission_code = perms[0]
        return [HasDynamicPermission()]

    def get_queryset(self):
        queryset = super().get_queryset()

        agent_id = self.request.query_params.get('agent_id')
        if agent_id:
            queryset = queryset.filter(agent__id=agent_id)

        return queryset
    


class AgentViewSet(viewsets.ModelViewSet):

    permission_classes = [HasDynamicPermission]

    """
    SNGD - Gestion complète : CRUD, Biométrie, Badges et Stats RH.
    """

    queryset = Agent.objects.all().order_by('-date_enrolement')
    serializer_class = AgentSerializer

    # 🔐 PERMISSION CODE GLOBAL PAR DÉFAUT
    permission_code = "view_agent"

    # 🔐 MAPPING DES PERMISSIONS PAR ACTION
    permission_map = {
        "list": ["view_agent"],
        "retrieve": ["view_agent"],

        "create": ["add_agent"],
        "update": ["change_agent"],
        "partial_update": ["change_agent"],

        "destroy": ["delete_agent"],

        "statistiques": ["view_agent_stats"],
        "taux_disponibilite": ["view_agent_stats"],

        "enroller_biometrie": ["change_agent_biometrie"],
        "badge_preview": ["view_agent_badge"],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])

        if not perms:
            self.permission_code = "view_agent"
            return [HasDynamicPermission()]

        self.permission_code = perms[0]
        return [HasDynamicPermission()]

    def get_queryset(self):
        """Recherche intelligente par Nom, Matricule ou NNI"""
        queryset = super().get_queryset()

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(postnom__icontains=search) |
                Q(matricule__icontains=search) |
                Q(nni__icontains=search)
            )

        return queryset

    # --- ACTION : STATISTIQUES GLOBAL DASHBOARD ---
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        return Response({
            'total': Agent.objects.count(),
            'en_poste': Agent.objects.filter(statut='EN POSTE').count(),
            'en_conge': Agent.objects.filter(statut='CONGÉ').count(),
            'alertes': Agent.objects.filter(statut='ALERTE').count(),
            'officiers_judiciaires': Agent.objects.filter(est_officier_judiciaire=True).count()
        })

    # --- ACTION : TAUX DISPONIBILITÉ ---
    @action(detail=False, methods=['get'])
    def taux_disponibilite(self, request):
        return Response({
            'matin': 95,
            'apres_midi': 82,
            'nuit': 70
        })

    # --- ACTION : BIOMÉTRIE ---
    @action(detail=True, methods=['patch', 'post'], url_path='enroller-biometrie')
    def enroller_biometrie(self, request, pk=None):
        agent = self.get_object()
        fingerprint = request.data.get('fingerprint_data')
        photo = request.FILES.get('photo')
        signature = request.FILES.get('signature')

        if not any([fingerprint, photo, signature]):
            return Response({'error': 'Aucune donnée fournie.'}, status=status.HTTP_400_BAD_REQUEST)

        if fingerprint:
            agent.empreinte_digitale = fingerprint
        if photo:
            agent.photo = photo
        if signature:
            agent.scan_signature = signature

        agent.save()

        return Response({
            'status': 'success',
            'message': f'Biométrie de {agent.nom} mise à jour.'
        })

    # --- ACTION : PREVIEW BADGE ---
    @action(detail=True, methods=['get'])
    def badge_preview(self, request, pk=None):
        agent = self.get_object()

        return Response({
            'full_name': f"{agent.nom.upper()} {agent.postnom} {agent.prenom}",
            'grade': agent.grade,
            'matricule': agent.matricule,
            'nni': agent.nni,
            'groupe_sanguin': agent.groupe_sanguin,
            'unite': agent.affectation,
            'photo_url': agent.photo.url if agent.photo else None,
            'is_officier': agent.est_officier_judiciaire
        })
    
class PointageViewSet(viewsets.ModelViewSet):
    queryset = Pointage.objects.all().order_by('-date_jour', '-heure_arrivee')
    serializer_class = PointageSerializer

    @action(detail=False, methods=['post'])
    def scanner(self, request):
        """
        Scan combiné : Matricule + Reconnaissance Faciale
        Attends : { 'matricule': 'AP-2026', 'image': [Fichier Image] }
        """
        matricule = request.data.get('matricule')
        image_file = request.FILES.get('image')

        if not matricule or not image_file:
            return Response({"error": "Matricule et image requis"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Trouver l'agent
            agent = Agent.objects.get(matricule=matricule, est_actif=True)
            
            if not agent.photo:
                return Response({"error": "Aucune photo de référence pour cet agent. Enrôlement requis."}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Charger l'image de référence (stockée en base)
            reference_image = face_recognition.load_image_file(agent.photo.path)
            ref_encodings = face_recognition.face_encodings(reference_image)

            if not ref_encodings:
                return Response({"error": "Impossible de lire le visage de référence."}, status=status.HTTP_400_BAD_REQUEST)
            
            ref_encoding = ref_encodings[0]

            # 3. Charger l'image reçue (caméra)
            camera_image = face_recognition.load_image_file(image_file)
            camera_encodings = face_recognition.face_encodings(camera_image)

            if not camera_encodings:
                return Response({"error": "Aucun visage détecté sur la photo."}, status=status.HTTP_400_BAD_REQUEST)
            
            camera_encoding = camera_encodings[0]

            # 4. Comparaison (Tolérance 0.6 par défaut, plus bas c'est plus strict)
            results = face_recognition.compare_faces([ref_encoding], camera_encoding, tolerance=0.5)

            if results[0]:
                # --- LOGIQUE DE POINTAGE SI MATCH ---
                now = datetime.now()
                date_du_jour = now.date()

                # Vérifier doublon
                if Pointage.objects.filter(agent=agent, date_jour=date_du_jour).exists():
                    return Response({"message": f"Bonjour {agent.nom}, vous avez déjà pointé."}, status=status.HTTP_200_OK)

                # Calcul retard
                HEURE_LIMITE = time(7, 30)
                statut_p = "PRÉSENT" if now.time() <= HEURE_LIMITE else "RETARD"

                nouveau_pointage = Pointage.objects.create(
                    agent=agent,
                    heure_arrivee=now.time(),
                    statut=statut_p,
                    methode="FACIALE"
                )

                return Response({
                    "status": "success",
                    "agent": f"{agent.nom} {agent.postnom}",
                    "heure": now.time().strftime("%H:%M"),
                    "statut": statut_p
                }, status=status.HTTP_201_CREATED)

            else:
                return Response({"error": "Échec de reconnaissance : le visage ne correspond pas au matricule."}, status=status.HTTP_401_UNAUTHORIZED)

        except Agent.DoesNotExist:
            return Response({"error": "Agent non reconnu ou inactif"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Erreur technique: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





























class ArticleListCreateAPIView(APIView):

    permission_classes = [IsAuthenticated]

    # 🔐 Permissions par méthode HTTP (PAS action)
    permission_map = {
        'GET': 'view_article',
        'POST': 'add_article',
    }

    def get_permissions(self):
        method = self.request.method

        perms = self.permission_map.get(method)

        # base auth
        permissions = [IsAuthenticated()]

        if perms:
            # injection correcte pour ton système dynamique
            self.permission_code = perms
            permissions.append(HasDynamicPermission())

        return permissions

    def get(self, request):
        articles = Article.objects.filter(est_archive=False).order_by('-derniere_mise_a_jour')
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ArticleSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





class ArticleDetailAPIView(APIView):

    permission_classes = [IsAuthenticated, HasDynamicPermission]

    def get_object(self, pk):
        try:
            return Article.objects.get(pk=pk)
        except Article.DoesNotExist:
            return None

    def put(self, request, pk):
        article = self.get_object(pk)
        if not article:
            return Response(status=status.HTTP_404_NOT_FOUND)

        data = request.data
        champs = ['nom', 'categorie', 'seuil_alerte', 'valeur_unitaire', 'unite']

        with transaction.atomic():
            for champ in champs:
                if champ in data:
                    old = str(getattr(article, champ))
                    new = str(data[champ])

                    if old != new:
                        HistoriqueArticle.objects.create(
                            article=article,
                            champ=champ.replace('_', ' ').capitalize(),
                            ancienne_valeur=old,
                            nouvelle_valeur=new
                        )

            serializer = ArticleSerializer(article, data=data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        article = self.get_object(pk)
        if not article:
            return Response(status=status.HTTP_404_NOT_FOUND)

        article.est_archive = True
        article.save()

        return Response(
            {"message": "Article déplacé dans la corbeille"},
            status=status.HTTP_200_OK
        )





class CorbeilleAPIView(APIView):
    """
    Gestion des articles supprimés
    """

    permission_classes = [IsAuthenticated, HasDynamicPermission]

    def get(self, request):
        articles = Article.objects.filter(est_archive=True)
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            article = Article.objects.get(pk=pk, est_archive=True)
            article.est_archive = False
            article.save()

            return Response(
                {"message": "Article restauré"},
                status=status.HTTP_200_OK
            )

        except Article.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            article = Article.objects.get(pk=pk, est_archive=True)
            article.delete()

            return Response(
                {"message": "Suppression définitive effectuée"},
                status=status.HTTP_204_NO_CONTENT
            )

        except Article.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)






class MouvementStockAPIView(APIView):
    """
    Gère les entrées et sorties de stock de manière sécurisée.

    
    """
    permission_classes = [IsAuthenticated, HasDynamicPermission]
    def post(self, request):
        # Récupération des données envoyées par React
        article_id = request.data.get('article_id')
        type_mouvement = request.data.get('type_mouvement') # ENTRÉE ou SORTIE
        quantite_mvt = int(request.data.get('quantite', 0))
        motif = request.data.get('motif', 'Non spécifié')
        
        # Validations de base
        if not all([article_id, type_mouvement, quantite_mvt > 0]):
            return Response({"error": "Données invalides ou quantité manquante."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # transaction.atomic() garantit que si une erreur survient, RIEN n'est sauvegardé.
            with transaction.atomic():
                # select_for_update() verrouille la ligne de l'article jusqu'à la fin de la transaction
                # Cela empêche les conflits si 2 personnes valident en même temps
                article = Article.objects.select_for_update().get(id=article_id)

                if type_mouvement == "SORTIE":
                    if article.quantite < quantite_mvt:
                        return Response({
                            "error": f"Stock insuffisant ! Il ne reste que {article.quantite} {article.unite}."
                        }, status=status.HTTP_400_BAD_REQUEST)
                    article.quantite -= quantite_mvt
                
                elif type_mouvement == "ENTRÉE":
                    article.quantite += quantite_mvt
                
                else:
                    return Response({"error": "Type de mouvement inconnu."}, status=status.HTTP_400_BAD_REQUEST)

                # Sauvegarder le nouveau solde de l'article
                article.save()

                # Créer la trace du mouvement (Historique)
                mouvement = MouvementStock.objects.create(
                    article=article,
                    type_mouvement=type_mouvement,
                    quantite=quantite_mvt,
                    motif=motif,
                    # operateur=request.user if request.user.is_authenticated else None
                )

                # Retourner les données formatées pour le ticket (OfficialReceipt) dans React
                return Response({
                    "message": "Mouvement validé avec succès",
                    "transaction_id": f"MVT-{mouvement.id}-{mouvement.date_mouvement.strftime('%y%m%d')}",
                    "nouveau_solde": article.quantite,
                    "type": type_mouvement
                }, status=status.HTTP_201_CREATED)

        except Article.DoesNotExist:
            return Response({"error": "L'article sélectionné n'existe pas."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    




class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.all().order_by('-date_demande')
    serializer_class = AbsenceSerializer

    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': ['view_absence'],
        'retrieve': ['view_absence'],
        'changer_statut': ['change_absence'],

        'create': ['add_absence'],
        'update': ['change_absence'],
        'partial_update': ['change_absence'],
        'destroy': ['delete_absence'],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])
        base = [IsAuthenticated]

        if not perms:
            return [p() for p in base]

        return [p() for p in base] + [HasDynamicPermission(perms)]

    @action(detail=True, methods=['patch'])
    def changer_statut(self, request, pk=None):
        absence = self.get_object()
        nouveau_statut = request.data.get('statut')

        if nouveau_statut in ['APPROUVÉ', 'REFUSÉ', 'EN_ATTENTE']:
            absence.statut = nouveau_statut
            absence.save()

            return Response({
                'status': 'Statut mis à jour',
                'nouveau_statut': absence.statut
            })

        return Response(
            {'error': 'Statut invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )


from django.utils import timezone

class PlanningViewSet(viewsets.ModelViewSet):
    queryset = Planning.objects.all().order_by('-date')
    serializer_class = PlanningSerializer

    permission_classes = [IsAuthenticated]

    permission_map = {
        'list': ['view_planning'],
        'retrieve': ['view_planning'],
        'statistiques_shifts': ['view_planning_stats'],

        'create': ['add_planning'],
        'update': ['change_planning'],
        'partial_update': ['change_planning'],
        'destroy': ['delete_planning'],
    }

    def get_permissions(self):
        perms = self.permission_map.get(self.action, [])
        base = [IsAuthenticated]

        if not perms:
            return [p() for p in base]

        return [p() for p in base] + [HasDynamicPermission(perms)]

    @action(detail=False, methods=['get'])
    def statistiques_shifts(self, request):
        today = timezone.now().date()
        shifts = ['MATIN', 'APRES_MIDI', 'NUIT']
        stats = {}

        for shift in shifts:
            total_attendus = Planning.objects.filter(date=today, vacation=shift).count()
            presents = Planning.objects.filter(date=today, vacation=shift, est_present=True).count()

            taux = int((presents / total_attendus) * 100) if total_attendus > 0 else 0

            stats[shift.lower()] = {
                'taux': taux,
                'presents': presents,
                'attendus': total_attendus
            }

        return Response(stats)



class ActiviteJournaliereViewSet(viewsets.ModelViewSet):
    queryset = ActiviteJournaliere.objects.all().order_by('heure_debut')
    serializer_class = ActiviteJournaliereSerializer

    permission_classes = [IsAuthenticated, HasDynamicPermission]

    permission_map = {
        'list': 'view_activite',
        'retrieve': 'view_activite',
        'activites_en_cours': 'view_activite',

        'create': 'add_activite',
        'update': 'change_activite',
        'partial_update': 'change_activite',

        'destroy': 'delete_activite',
        'basculer_statut': 'change_activite',
    }

    def get_permissions(self):
        self.permission_code = self.permission_map.get(self.action)
        return [permission() for permission in self.permission_classes]

    @action(detail=False, methods=['get'], url_path='actuelles')
    def activites_en_cours(self, request):
        activites = self.queryset.filter(est_actuelle=True)
        serializer = self.get_serializer(activites, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def basculer_statut(self, request, pk=None):
        activite = self.get_object()
        activite.est_actuelle = not activite.est_actuelle
        activite.save()
        return Response({
            'status': 'Statut mis à jour',
            'est_actuelle': activite.est_actuelle
        })


class RationAlimentaireViewSet(viewsets.ModelViewSet):
    queryset = RationAlimentaire.objects.all().order_by('-date')
    serializer_class = RationAlimentaireSerializer

    permission_classes = [IsAuthenticated, HasDynamicPermission]

    permission_map = {
        'list': 'view_ration',
        'retrieve': 'view_ration',
        'bilan_jour': 'view_ration',

        'create': 'add_ration',
        'update': 'change_ration',
        'partial_update': 'change_ration',

        'destroy': 'delete_ration',
    }

    def get_permissions(self):
        self.permission_code = self.permission_map.get(self.action)
        return [permission() for permission in self.permission_classes]

    @action(detail=False, methods=['get'], url_path='bilan-du-jour')
    def bilan_jour(self, request):
        aujourdhui = timezone.now().date()
        rations = self.queryset.filter(date=aujourdhui)
        serializer = self.get_serializer(rations, many=True)
        return Response(serializer.data)


class CorveeViewSet(viewsets.ModelViewSet):
    queryset = Corvee.objects.all().order_by('-id')
    serializer_class = CorveeSerializer

    permission_classes = [IsAuthenticated, HasDynamicPermission]

    permission_map = {
        'list': 'view_corvee',
        'retrieve': 'view_corvee',
        'corvees_actives': 'view_corvee',

        'create': 'add_corvee',
        'update': 'change_corvee',
        'partial_update': 'change_corvee',

        'destroy': 'delete_corvee',

        'marquer_termine': 'change_corvee',
        'incident': 'change_corvee',
    }

    def get_permissions(self):
        self.permission_code = self.permission_map.get(self.action)
        return [permission() for permission in self.permission_classes]

    @action(detail=True, methods=['post'], url_path='terminer')
    def marquer_termine(self, request, pk=None):
        corvee = self.get_object()
        corvee.statut = "TERMINE"
        corvee.save()
        return Response({'status': 'Corvée terminée avec succès'})

    @action(detail=True, methods=['post'], url_path='signaler-incident')
    def incident(self, request, pk=None):
        corvee = self.get_object()
        corvee.statut = "INCIDENT"
        corvee.save()
        return Response(
            {'status': 'Incident signalé'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'], url_path='en-cours')
    def corvees_actives(self, request):
        actives = self.queryset.filter(statut="EN_COURS")
        serializer = self.get_serializer(actives, many=True)
        return Response(serializer.data)

from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class DecesViewSet(viewsets.ModelViewSet):
    serializer_class = DecesSerializer
    permission_classes = [HasDynamicPermission]
    
    # 1. On définit une map pour que le middleware sache quel code utiliser par action
    # (Assure-toi que ton HasDynamicPermission lit cette map ou utilise 'view.action')
    permission_map = {
        'list': 'view_deces',
        'retrieve': 'view_deces',
        'create': 'add_deces',
        'valider': 'valider_deces',
        'enquete': 'enquete_deces',
        'list_corbeille': 'view_trash_deces',
        'mettre_en_corbeille': 'delete_deces',
        'restaurer': 'restore_deces',
        'supprimer_definitivement': 'hard_delete_deces',
    }

    def get_queryset(self):
        # On sépare proprement les actifs de la corbeille
        if self.action in ['list_corbeille', 'restaurer', 'supprimer_definitivement']:
            return Deces.objects.filter(is_deleted=True).select_related('detenu')
        return Deces.objects.filter(is_deleted=False).select_related('detenu')

    def get_permission_code(self):
        """Utilisé par ton middleware pour savoir quoi vérifier"""
        return self.permission_map.get(self.action, "view_deces")

    def perform_create(self, serializer):
        serializer.save(declare_par=self.request.user)

    # --- ACTIONS DE STATUT ---

    @action(detail=True, methods=['post'])
    @transaction.atomic # Sécurité : si le save() du modèle plante, on rollback tout
    def valider(self, request, pk=None):
        deces = self.get_object()
        if deces.statut == 'VALIDE':
            return Response({"error": "Ce décès est déjà validé officiellement."}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        deces.statut = 'VALIDE'
        deces.valide_par = request.user
        deces.save() # Ici, le save() de ton modèle va tuer le détenu automatiquement
        return Response({"message": "Décès validé et statut du détenu mis à jour."})

    @action(detail=True, methods=['post'])
    def enquete(self, request, pk=None):
        deces = self.get_object()
        deces.statut = 'ENQUETE'
        deces.save()
        return Response({"message": "Dossier placé sous enquête."})

    # --- GESTION CORBEILLE ---

    @action(detail=False, methods=['get'])
    def list_corbeille(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mettre_en_corbeille(self, request, pk=None):
        deces = self.get_object()
        deces.soft_delete()
        return Response({"message": "Dossier déplacé dans la corbeille."})

    @action(detail=True, methods=['post'])
    def restaurer(self, request, pk=None):
        # On récupère l'objet même s'il est is_deleted=True
        deces = self.get_queryset().get(pk=pk)
        deces.restore()
        return Response({"message": "Dossier restauré avec succès."})

    @action(detail=True, methods=['delete'])
    def supprimer_definitivement(self, request, pk=None):
        deces = self.get_queryset().get(pk=pk)
        # On vérifie une dernière fois si c'est bien en corbeille
        if not deces.is_deleted:
             return Response({"error": "Impossible de supprimer un dossier actif."}, status=400)
             
        deces.delete() 
        return Response({"message": "Dossier supprimé définitivement de la base de données."})



from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from .models import TraceurAudit
from .serializers import TraceurAuditSerializer


class TraceurAuditViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GOUVERNEMENT RDC - HAUTE SÉCURITÉ
    Module d'Audit : LECTURE SEULE STRICTE. 
    Aucune modification ou suppression n'est autorisée sur cette route.
    """
    queryset = TraceurAudit.objects.select_related('utilisateur', 'content_type').all().order_by('-date_action')
    serializer_class = TraceurAuditSerializer
    
    # Sécurité : Seuls les administrateurs/inspecteurs peuvent consulter les logs
    permission_classes = [IsAdminUser] 
    
    # Configuration des filtres d'investigation
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Filtrage exact (ex: voir toutes les actions sur "Deces" ou par "agent X")
    filterset_fields = ['type_action', 'table_concernee', 'utilisateur']
    
    # Recherche textuelle (ex: chercher une adresse IP spécifique ou un UUID d'objet)
    search_fields = ['object_id', 'adresse_ip', 'utilisateur__username']
    
    # Tri (par défaut du plus récent au plus ancien, déjà défini dans le queryset)
    ordering_fields = ['date_action']