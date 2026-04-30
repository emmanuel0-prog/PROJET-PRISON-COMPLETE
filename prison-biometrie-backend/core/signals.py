from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Visiteur, Watchlist, MouvementExterieur

@receiver(pre_save, sender=Visiteur)
def verifier_securite_visiteur(sender, instance, **kwargs):
    """
    Avant de sauvegarder un visiteur, on vérifie s'il est fiché 
    ou si son comportement est suspect.
    """
    if instance.piece_identite_numero:
        # 1. Vérification dans la Watchlist officielle
        fiche_noire = Watchlist.objects.filter(
            numero_piece_identite=instance.piece_identite_numero
        ).first()
        
        if fiche_noire:
            instance.alerte_securite = True
            instance.niveau_alerte = 5  # Alerte maximale
            instance.observations_securite = f"ALERTE ROUGE : Présent dans la Watchlist. Motif : {fiche_noire.motif}"
            instance.statut = 'REFUSE' # On peut même forcer le refus d'accès

    # 2. Logique pour les Avocats (Confidentiel)
    if instance.type_visiteur == 'AVOCAT':
        instance.est_confidentiel = True


@receiver(post_save, sender=MouvementExterieur)
def audit_mouvement(sender, instance, created, **kwargs):
    # L'utilisation de 'instance.statut' au lieu de 'type_mouvement' corrige l'erreur 500
    if created and instance.statut == 'HORS MURS':
        print(f"🚨 ALERTE SORTIE : Le détenu {instance.detenu.nom} est sorti vers {instance.destination}")


