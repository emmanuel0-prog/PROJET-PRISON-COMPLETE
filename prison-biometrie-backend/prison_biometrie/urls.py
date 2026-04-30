from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')), # Vérifie que core.urls existe !
    path('api/dashboard/', include('dashboard.urls')), # Vérifie que dashboard.urls existe !
    path('api/users/', include('users.urls')),
    path('api/auth-audit/', include('authentication_audit.urls')), # NEW
]

# Pour gérer les photos des détenus
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)