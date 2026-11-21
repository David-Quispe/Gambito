from decimal import Decimal, InvalidOperation

from django.db.models import Case, DecimalField, ExpressionWrapper, F, Q, Sum, Value, When
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import STOCK_BAJO, Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer

# Valores aceptados en ?orden=
ORDENES = {
    'precio_asc': 'precio_con_descuento',
    'precio_desc': '-precio_con_descuento',
    'nombre': 'nombre',
    'populares': '-ventas',
    'descuento': '-descuento',
}


def _a_decimal(texto):
    try:
        return Decimal(texto)
    except (InvalidOperation, TypeError):
        return None


class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ProductoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductoSerializer

    def get_queryset(self):
        # Precio ya con el descuento aplicado, para poder filtrar y ordenar por él
        qs = Producto.objects.select_related('categoria').annotate(
            precio_con_descuento=ExpressionWrapper(
                F('precio') * (100 - F('descuento')) / Value(100),
                output_field=DecimalField(max_digits=10, decimal_places=2),
            )
        )
        if self.action != 'list':
            return qs

        params = self.request.query_params

        categoria = params.get('categoria')
        if categoria and categoria != 'Todos':
            qs = qs.filter(categoria__nombre__iexact=categoria)

        tipo = params.get('tipo')
        if tipo and tipo != 'todos':
            qs = qs.filter(tipo=tipo)

        buscar = (params.get('buscar') or '').strip()
        if buscar:
            qs = qs.filter(
                Q(nombre__icontains=buscar)
                | Q(descripcion__icontains=buscar)
                | Q(categoria__nombre__icontains=buscar)
            )

        precio_min = _a_decimal(params.get('precio_min'))
        if precio_min is not None:
            qs = qs.filter(precio_con_descuento__gte=precio_min)
        precio_max = _a_decimal(params.get('precio_max'))
        if precio_max is not None:
            qs = qs.filter(precio_con_descuento__lte=precio_max)

        if params.get('oferta') in ('1', 'true'):
            qs = qs.filter(descuento__gt=0)
        if params.get('disponible') in ('1', 'true'):
            qs = qs.filter(stock__gt=0)

        orden = ORDENES.get(params.get('orden', ''))
        if orden:
            qs = qs.order_by(orden, 'id')
        return qs

    @action(detail=False, methods=['get'], url_path='recomendados')
    def recomendados(self, request):
        """Recomendaciones generales para el inicio: lo más vendido con stock."""
        populares = self.get_queryset().filter(stock__gt=0).order_by('-ventas', '-descuento', 'id')[:4]
        return Response(self.get_serializer(populares, many=True).data)

    @action(detail=True, methods=['get'], url_path='recomendaciones')
    def recomendaciones(self, request, pk=None):
        """Juegos parecidos al producto indicado.

        Cada candidato recibe puntos:
          +4 si es de la misma categoría
          +2 si su precio final está a menos de 40 % del precio del juego visto
          +1 si comparte el rango de edad
          +0 a +2 según qué tan vendido es (ranking entre los candidatos)
          +1 si está en oferta
        Los agotados se descartan y se devuelven los 4 con más puntos.
        """
        base = self.get_object()
        candidatos = list(
            self.get_queryset().exclude(pk=base.pk).filter(stock__gt=0)
        )
        if not candidatos:
            return Response([])

        max_ventas = max(c.ventas for c in candidatos) or 1
        precio_base = base.precio_final

        def puntaje(c):
            puntos = 0.0
            if c.categoria_id == base.categoria_id:
                puntos += 4
            if precio_base > 0 and abs(c.precio_final - precio_base) / precio_base <= Decimal('0.4'):
                puntos += 2
            if c.edad == base.edad:
                puntos += 1
            puntos += 2 * c.ventas / max_ventas
            if c.en_oferta:
                puntos += 1
            return puntos

        mejores = sorted(candidatos, key=lambda c: (-puntaje(c), c.id))[:4]
        return Response(self.get_serializer(mejores, many=True).data)

    @action(detail=True, methods=['post'], url_path='ajustar-stock', permission_classes=[IsAdminUser])
    def ajustar_stock(self, request, pk=None):
        """Solo administradores. Suma o resta unidades al inventario. Body: {"cantidad": 5} o {"cantidad": -2}."""
        producto = self.get_object()
        try:
            cantidad = int(request.data.get('cantidad'))
        except (TypeError, ValueError):
            return Response({'detalle': 'Envía "cantidad" como número entero.'}, status=400)

        nuevo = producto.stock + cantidad
        if nuevo < 0:
            return Response(
                {'detalle': f'No se puede dejar el stock en negativo (hay {producto.stock}).'},
                status=400,
            )
        producto.stock = nuevo
        producto.save(update_fields=['stock'])
        return Response(self.get_serializer(producto).data)

    @action(detail=False, methods=['get'], url_path='inventario', permission_classes=[IsAdminUser])
    def inventario(self, request):
        """Solo administradores. Resumen del inventario."""
        productos = Producto.objects.all()
        valor = productos.aggregate(
            total=Sum(
                F('precio') * F('stock'),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        )['total'] or Decimal('0')
        return Response({
            'total_productos': productos.count(),
            'unidades': productos.aggregate(t=Sum('stock'))['t'] or 0,
            'agotados': productos.filter(stock=0).count(),
            'stock_bajo': productos.filter(stock__gt=0, stock__lte=STOCK_BAJO).count(),
            'en_oferta': productos.filter(descuento__gt=0).count(),
            'valor_inventario': float(valor),
            'umbral_stock_bajo': STOCK_BAJO,
        })
