from django.urls import path
from rest_framework.routers import DefaultRouter

from .cuentas import LoginView, LogoutView, RegistroView, YoView
from .views import CategoriaViewSet, ProductoViewSet

router = DefaultRouter()
router.register('categorias', CategoriaViewSet)
router.register('productos', ProductoViewSet, basename='producto')

urlpatterns = [
    path('auth/registro/', RegistroView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('auth/yo/', YoView.as_view()),
] + router.urls
