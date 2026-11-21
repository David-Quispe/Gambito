"""Lista de deseos de cada persona y reporte de demanda para el administrador."""
from django.db.models import Count
from rest_framework import serializers, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import STOCK_BAJO, Deseo, Producto
from .serializers import ProductoSerializer


class DeseosView(APIView):
    """GET: mis deseos (productos completos). POST {producto}: agrega uno."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        productos = [d.producto for d in Deseo.objects.filter(usuario=request.user).select_related('producto__categoria')]
        return Response(ProductoSerializer(productos, many=True, context={'request': request}).data)

    def post(self, request):
        entrada = serializers.IntegerField().run_validation(request.data.get('producto'))
        producto = Producto.objects.filter(pk=entrada).first()
        if producto is None:
            return Response({'detail': 'Ese producto no existe.'}, status=status.HTTP_404_NOT_FOUND)
        _, nuevo = Deseo.objects.get_or_create(usuario=request.user, producto=producto)
        return Response({'producto': producto.id}, status=status.HTTP_201_CREATED if nuevo else status.HTTP_200_OK)


class DeseoDetalleView(APIView):
    """DELETE: quita un producto de mis deseos (si no estaba, no pasa nada)."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, producto_id):
        Deseo.objects.filter(usuario=request.user, producto_id=producto_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DemandaView(APIView):
    """Reporte para el administrador: qué se desea, qué se vende y dónde falta stock."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        filas = []
        for p in Producto.objects.select_related('categoria').annotate(n_deseos=Count('deseos')):
            if p.n_deseos == 0 and p.ventas == 0:
                continue
            filas.append({
                'id': p.id,
                'nombre': p.nombre,
                'categoria': p.categoria.nombre,
                'deseos': p.n_deseos,
                'ventas': p.ventas,
                'stock': p.stock,
                # mucha gente lo quiere y queda poco: conviene reponerlo
                'reponer': p.n_deseos > 0 and p.stock <= STOCK_BAJO,
            })
        # mayor demanda primero: deseos y ventas pesan igual
        filas.sort(key=lambda f: (-(f['deseos'] + f['ventas']), f['nombre']))
        return Response({
            'total_deseos': Deseo.objects.count(),
            'productos': filas,
        })
