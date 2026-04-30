import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
import pyotp

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrateur Système'),
        ('MINISTRE', 'Ministre de la Justice'),
        ('DIRECTEUR', 'Directeur de Prison'),
        ('GREFFIER', 'Greffier De la Justice'),
        ('MEDECIN', 'Service Médical'),
        ('INTENDANT', 'Logistique & Intendance'),
        ('AGENT', 'Agent de Détention'),
        ('SECURITE', 'Chef de Sécurité'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='AGENT', db_index=True)
    telephone = models.CharField(max_length=15, null=True, blank=True)

    # 🔐 2FA
    two_factor_enabled = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=100, null=True, blank=True)

    is_verified = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    def enable_2fa(self):
        """Active proprement le 2FA"""
        import pyotp
        self.otp_secret = pyotp.random_base32()
        self.two_factor_enabled = True
        self.save()

    def disable_2fa(self):
        """Désactive proprement le 2FA"""
        self.two_factor_enabled = False
        self.otp_secret = None
        self.save()


class Permission(models.Model):
    name = models.CharField(max_length=100)  # ex: "Éditer Dossier Médical"
    code = models.CharField(max_length=100, unique=True)  # ex: "edit_medical"
    description = models.TextField(null=True, blank=True)
    category = models.CharField(max_length=50, default="GENERAL") # Pour grouper dans le frontend

    def __str__(self):
        return f"{self.name} [{self.code}]"

class RolePermission(models.Model):
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="roles")

    class Meta:
        # 🛡️ Empêche d'ajouter deux fois la même permission à un rôle
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role} -> {self.permission.code}"