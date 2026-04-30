from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # ViewSets
    DetenuViewSet, PrisonViewSet, ParquetViewSet, CelluleViewSet, 
    AffectationCelluleViewSet, MouvementExterieurViewSet, ConsultationViewSet, 
    CantineViewSet, VisiteurViewSet, DossierJudiciaireViewSet, DocumentEcrouViewSet, 
    TribunalViewSet, PointageViewSet, PlanningViewSet, AbsenceViewSet,
    ActiviteJournaliereViewSet, RationAlimentaireViewSet, CorveeViewSet, 
    PavillonViewSet, AgentViewSet,
    
    # APIViews & Function Views (Existants)
    VieCarceraleAPIView, get_presence_list, update_presence, 
    medical_dashboard_stats, historique_detenu, update_consultation_status, 
    MouvementStockAPIView, cloturer_visite, IntelligenceDashboardAPI, 
    cloturer_visite_scan,

    # NOUVELLES API STOCKS (CRUD + CORBEILLE)
    ArticleListCreateAPIView, 
    ArticleDetailAPIView, 
    CorbeilleAPIView, DecesViewSet, TraceurAuditViewSet
)


# 1. Configuration du Router
router = DefaultRouter()
router.register(r'detenus', DetenuViewSet, basename='detenu')
router.register(r'prisons', PrisonViewSet)
router.register(r'parquets', ParquetViewSet)
router.register(r'activites', ActiviteJournaliereViewSet)
router.register(r'rations', RationAlimentaireViewSet)
router.register(r'corvees', CorveeViewSet)
router.register(r'cellules', CelluleViewSet, basename='cellule')
router.register(r'affectations', AffectationCelluleViewSet)
router.register(r'mouvements-exterieurs', MouvementExterieurViewSet, basename='mouvementexterieur')
router.register(r'consultations', ConsultationViewSet, basename='consultation')
router.register(r'cantine', CantineViewSet, basename='cantine')
router.register(r'tribunaux', TribunalViewSet)
router.register(r'agents', AgentViewSet, basename='agent')
router.register(r'pointages', PointageViewSet, basename='pointage')
router.register(r'visiteurs', VisiteurViewSet, basename='visiteur')
router.register(r'pavillons', PavillonViewSet)
router.register(r'dossiers-judiciaires', DossierJudiciaireViewSet, basename='dossierjudiciaire')
router.register(r'documents-ecrou', DocumentEcrouViewSet, basename='documentecrou')
router.register(r'absences', AbsenceViewSet)
router.register(r'plannings', PlanningViewSet, basename='planning')
router.register(r'deces', DecesViewSet, basename='deces')
router.register(r'audit-logs', TraceurAuditViewSet, basename='traceur-audit')

# 2. Les URLs du projet
urlpatterns = [
    # --- MODULE : INTELLIGENCE & SÉCURITÉ ---
    path('intelligence/dashboard/', IntelligenceDashboardAPI.as_view(), name='intelligence-dashboard'),
    
    # --- MODULE : GESTION DES STOCKS (CORRIGÉ & COMPLÉTÉ) ---
    # Liste & Création
    path('stocks/articles/', ArticleListCreateAPIView.as_view(), name='stocks-articles-list'),
    # Modification & Suppression (Soft Delete)
    path('stocks/articles/<int:pk>/', ArticleDetailAPIView.as_view(), name='stocks-articles-detail'),
    # Mouvements de stock (Entrées/Sorties avec calcul de solde)
    path('stocks/mouvement/', MouvementStockAPIView.as_view(), name='stocks-mouvement'),
    # Corbeille : Liste globale des supprimés
    path('stocks/corbeille/', CorbeilleAPIView.as_view(), name='stocks-corbeille-list'),
    # Corbeille : Action sur un article précis (Restaurer ou Supprimer définitivement)
    path('stocks/corbeille/<int:pk>/', CorbeilleAPIView.as_view(), name='stocks-corbeille-detail'),

    # --- MODULE : VISITEURS ---
    path('visiteurs/<str:pk>/cloturer-visite/', cloturer_visite, name='cloturer_visite_old'),
    path('visiteurs/<str:pk>/cloturer/', cloturer_visite, name='cloturer_visite'),
    path('visiteurs/<str:pk>/valider-entree/', VisiteurViewSet.as_view({'get': 'valider_entree', 'patch': 'valider_entree'}), name='visiteur-valider-entree'),
    
    # Routes automatiques du router
    path('', include(router.urls)),
    
    # --- MODULE : INTELLIGENCE RECHERCHE ---
    path('intelligence/recherche-croisee/', VisiteurViewSet.as_view({'get': 'recherche_croisee'}), name='intelligence-recherche'),
    path('intelligence/watchlist/', VisiteurViewSet.as_view({'get': 'check_watchlist'}), name='intelligence-watchlist'),

    # --- MODULE : GESTION QUOTIDIENNE ---
    path('vie-carcerale/', VieCarceraleAPIView.as_view(), name='vie-carcerale'),
    path('presence-list/', get_presence_list, name='presence_list'),
    path('presence/<int:detenu_id>/', update_presence, name='update_presence'),
    
    # --- MODULE : SANTÉ & INFIRMERIE ---
    path('medical-stats/', medical_dashboard_stats, name='medical_stats'),
    path('medical/historique/<int:detenu_id>/', historique_detenu, name='historique_detenu'),
    path('consultations/<int:pk>/update-status/', update_consultation_status, name='update_medical_status'),
]