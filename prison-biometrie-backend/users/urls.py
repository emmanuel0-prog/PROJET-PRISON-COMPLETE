from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    login_view,
    TestAuthView,
    get_permissions,
    get_role_permissions,
    AssignPermissionView,  # Assure-toi que c'est bien la classe
    remove_permission,
    my_permissions,
    all_roles_permissions,
    list_users,
    user_detail,
    create_user,
)

urlpatterns = [
    # 🔐 AUTHENTIFICATION
    path('login/', login_view, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('test-auth/', TestAuthView.as_view(), name='test-auth'),

    # 👥 UTILISATEURS
    path('', list_users, name='list-users'),
    path('<uuid:pk>/', user_detail, name='user-detail'),

    # 🔑 PERMISSIONS (RBAC)
    # 1. Routes statiques (en priorité absolue)
    path('permissions/', get_permissions, name='permissions-list'),
    path('permissions/assign/', AssignPermissionView.as_view(), name='assign-permission'),
    path('permissions/remove/', remove_permission, name='remove-permission'),
    path('permissions/me/', my_permissions, name='my-permissions'),
    path('permissions/all/', all_roles_permissions, name='all-roles-permissions'),
    
    # 2. Route dynamique (toujours en bas pour ne pas bloquer les autres)
    path('permissions/<str:role>/', get_role_permissions, name='permissions-by-role'),

    path('create/', create_user, name='create-user'),
]