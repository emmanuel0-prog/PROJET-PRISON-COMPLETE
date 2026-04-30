from django.contrib import admin
from .models import (
    Province,
    Ville,
    Prison,
    Detenu,
    DossierJudiciaire,
    Cellule,
    AffectationCellule,
    MouvementExterieur,
    JournalAudit,
    ActiviteJournaliere,
    RationAlimentaire,
    Corvee,
    Consultation,
    StockMedicament,
    ArticleCantine,
    TransactionCantine,
    Parquet,
    JournalActivite,
    Visiteur,
    Agent, 
    MouvementStock,
    Article, 
    Pavillon,
    Absence,
    Tribunal,
    DocumentEcrouHistory,
    TraceurAudit, Deces

    
    
    
    
)

@admin.register(Detenu)
class DetenuAdmin(admin.ModelAdmin):
    list_display = ("matricule", "nom", "prenom", "prison", "statut_juridique")
    search_fields = ("matricule", "nom", "prenom")
    list_filter = ("statut_juridique", "prison", "sexe")

admin.site.register(Province)
admin.site.register(Ville)
admin.site.register(Prison)
admin.site.register(DossierJudiciaire)
admin.site.register(Cellule)
admin.site.register(AffectationCellule)
admin.site.register(MouvementExterieur)
admin.site.register(JournalAudit)
admin.site.register(ActiviteJournaliere)
admin.site.register(RationAlimentaire)
admin.site.register(Corvee)
admin.site.register(Consultation)
admin.site.register(StockMedicament)
admin.site.register(ArticleCantine)
admin.site.register(TransactionCantine)
admin.site.register(Parquet)
admin.site.register(JournalActivite)
admin.site.register(Visiteur)
admin.site.register(Agent)
admin.site.register(Article)
admin.site.register(MouvementStock)
admin.site.register(Pavillon)
admin.site.register(Absence)
admin.site.register(Tribunal)
admin.site.register(DocumentEcrouHistory)
admin.site.register(TraceurAudit)
admin.site.register(Deces)
