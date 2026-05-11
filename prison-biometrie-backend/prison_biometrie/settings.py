from pathlib import Path
import os
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ========================
# 🔐 SÉCURITÉ
# ========================
SECRET_KEY = 'django-insecure--1z^_d9g@u%k94o^=p8sm^74hhtw^4vwt*$95)nburhmhuvk+('

DEBUG = False

ALLOWED_HOSTS = [
    "167.71.2.177",
    "localhost",
    "127.0.0.1",
]

# ========================
# 🔥 CUSTOM USER MODEL
# ========================
AUTH_USER_MODEL = 'users.User'

# ========================
# APPS
# ========================
INSTALLED_APPS = [
    # ASGI / WEBSOCKET
    'daphne',
    'channels',

    # DJANGO
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # THIRD PARTY
    'django_filters',
    'simple_history',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # LOCAL APPS
    'users',
    'core',
    'biometrie',
    'dashboard',
    'authentication_audit',
]

# ========================
# CORS
# ========================
CORS_ALLOW_ALL_ORIGINS = True

# ========================
# MIDDLEWARE
# ========================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',

    'corsheaders.middleware.CorsMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',

    # Active si nécessaire
    # 'django.middleware.csrf.CsrfViewMiddleware',

    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    'core.middleware.AuditMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
]

# ========================
# URLS
# ========================
ROOT_URLCONF = 'prison_biometrie.urls'

# ========================
# TEMPLATES
# ========================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        'DIRS': [],

        'APP_DIRS': True,

        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',

                'django.contrib.auth.context_processors.auth',

                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ========================
# WSGI / ASGI
# ========================
WSGI_APPLICATION = 'prison_biometrie.wsgi.application'
ASGI_APPLICATION = 'prison_biometrie.asgi.application'

# ========================
# CHANNELS / REDIS
# ========================
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}

# ========================
# CACHE REDIS
# ========================
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
    }
}

# ========================
# DATABASE POSTGRESQL
# ========================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',

        'NAME': os.getenv('DB_NAME', 'database_prison_biometrie'),

        'USER': os.getenv('DB_USER', 'prison_user'),

        'PASSWORD': os.getenv('DB_PASSWORD', 'emmanuel---@@@##123'),

        'HOST': os.getenv('DB_HOST', '127.0.0.1'),

        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# ========================
# REST FRAMEWORK
# ========================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],

    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],

    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}

# ========================
# JWT
# ========================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),

    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),

    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ========================
# PASSWORD VALIDATORS
# ========================
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
]

# ========================
# LOCALISATION
# ========================
LANGUAGE_CODE = 'fr-fr'

TIME_ZONE = 'Africa/Kinshasa'

USE_I18N = True

USE_TZ = True

# ========================
# STATIC FILES
# ========================
STATIC_URL = '/static/'

STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'

MEDIA_ROOT = BASE_DIR / 'media'

# ========================
# DEFAULT FIELD
# ========================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'