from django.db import models
from core.models import Detenu


class EmpreinteDigitale(models.Model):
    """
    Empreinte digitale liée à un seul détenu
    """

    detenu = models.OneToOneField(
        Detenu,
        on_delete=models.CASCADE,
        related_name="empreinte"
    )

    code_empreinte = models.CharField(
        max_length=255,
        unique=True,
        help_text="Identifiant unique de l'empreinte (hash / template)"
    )

    qualite = models.PositiveSmallIntegerField(
        default=0,
        help_text="Qualité de l'empreinte (0 à 100)"
    )

    appareil = models.CharField(
        max_length=100,
        blank=True,
        help_text="Nom du scanner biométrique"
    )

    date_enregistrement = models.DateTimeField(auto_now_add=True)

    actif = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Empreinte Digitale"
        verbose_name_plural = "Empreintes Digitales"
        ordering = ["-date_enregistrement"]

    def __str__(self):
        return f"Empreinte - {self.detenu.matricule} ({self.qualite}%)"


class ReconnaissanceFaciale(models.Model):
    """
    Données faciales liées à un seul détenu
    """

    detenu = models.OneToOneField(
        Detenu,
        on_delete=models.CASCADE,
        related_name="face"
    )

    face_id = models.CharField(
        max_length=255,
        unique=True,
        help_text="Identifiant unique facial (vector / encoding)"
    )

    score_confiance = models.PositiveSmallIntegerField(
        default=0,
        help_text="Score de confiance (0 à 100)"
    )

    camera = models.CharField(
        max_length=100,
        blank=True,
        help_text="Caméra utilisée pour la capture"
    )

    date_enregistrement = models.DateTimeField(auto_now_add=True)

    actif = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Reconnaissance Faciale"
        verbose_name_plural = "Reconnaissances Faciales"
        ordering = ["-date_enregistrement"]

    def __str__(self):
        return f"FaceID - {self.detenu.matricule} ({self.score_confiance}%)"
