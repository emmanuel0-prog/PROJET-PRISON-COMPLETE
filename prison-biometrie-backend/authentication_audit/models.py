import uuid
from django.db import models
from django.conf import settings


class AuthAuditLog(models.Model):

    EVENT_CHOICES = (
        ("LOGIN_SUCCESS", "Connexion réussie"),
        ("LOGIN_FAILED", "Échec connexion"),
        ("OTP_REQUIRED", "OTP requis"),
        ("OTP_SUCCESS", "OTP validé"),
        ("OTP_FAILED", "OTP échoué"),

        # 🔥 NOUVEAUX
        ("ACCOUNT_LOCKED", "IP bloquée"),
        ("SUSPICIOUS_LOGIN", "Connexion suspecte"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    username_attempt = models.CharField(max_length=150, null=True, blank=True)

    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    # 🔥 NOUVEAU (géolocalisation)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)

    # 🔥 NOUVEAU (score sécurité)
    risk_level = models.CharField(
        max_length=20,
        choices=(
            ("LOW", "Faible"),
            ("MEDIUM", "Moyen"),
            ("HIGH", "Élevé"),
        ),
        default="LOW"
    )

    success = models.BooleanField(default=False)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.event_type} - {self.username_attempt or self.user}"