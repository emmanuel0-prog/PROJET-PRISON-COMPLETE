from django.urls import path
from .views.kpi_views import (
    DashboardAPIView, 
    
    PredictionAPIView,      # <-- NEW
    AlertesJuridiquesView   # <-- NEW (Si tu as séparé les ODP)
)
from .views.population_views import EvolutionPopulationView
from .views.mouvements_views import MouvementCreateAPIView
from .views.intelligence_views import IntelligenceDashboardView
from .views.geographie_views import CartePrisonsView
from .views.ia_avance_views import DashboardIAAvanceAPIView

urlpatterns = [
    # --- Statistiques de base ---
    path('kpis/', DashboardAPIView.as_view(), name='dashboard-kpis'),
    path('evolution/', EvolutionPopulationView.as_view(), name='dashboard-evolution'),
    path('geographie/', CartePrisonsView.as_view(), name='dashboard-geo'),
    path('mouvements-recents/', MouvementCreateAPIView.as_view(), name='dashboard-mouvements'),

    # --- Intelligence & Sécurité ---
    path('intelligence/', IntelligenceDashboardView.as_view(), name='dashboard-intelligence'),
    
    path('alertes-juridiques/', AlertesJuridiquesView.as_view(), name='dashboard-alertes-odp'), # NEW

    # --- Prédictions IA ---
    path('predictions/', PredictionAPIView.as_view(), name='dashboard-predictions'), # NEW
    path('ia-avance/', DashboardIAAvanceAPIView.as_view(), name='dashboard-ia-avance'),

    # --- Endpoint de secours / Synthèse ---
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard-main'),
]