from django.urls import path
from rest_framework.routers import DefaultRouter

from .cuentas import LoginView, LogoutView, RegistroView, YoView
from .arbitro import ArbitroView, JugadaIAView
from .deseos import DemandaView, DeseoDetalleView, DeseosView
from .novedades import NovedadViewSet
from .pedidos import PedidoViewSet
from .views import CategoriaViewSet, ProductoViewSet

router = DefaultRouter()
router.register('categorias', CategoriaViewSet)
router.register('productos', ProductoViewSet, basename='producto')
router.register('pedidos', PedidoViewSet, basename='pedido')
router.register('novedades', NovedadViewSet, basename='novedad')

urlpatterns = [
    path('auth/registro/', RegistroView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('auth/yo/', YoView.as_view()),
    path('deseos/', DeseosView.as_view()),
    path('deseos/<int:producto_id>/', DeseoDetalleView.as_view()),
    path('demanda/', DemandaView.as_view()),
    path('arbitro/', ArbitroView.as_view()),
    path('ia/jugada/', JugadaIAView.as_view()),
] + router.urls
