"""Novedades de la tienda: torneos, juegos nuevos y sorteos con inscripción."""
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Novedad, Participacion


def esta_cerrada(novedad, inscritos):
    """Un torneo o sorteo deja de aceptar gente si ya tiene ganador, pasó la fecha o se llenó."""
    if novedad.tipo == 'nuevo':
        return False
    if novedad.ganador_id:
        return True
    if novedad.fecha and novedad.fecha < timezone.now():
        return True
    return novedad.cupos is not None and inscritos >= novedad.cupos


class NovedadSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source='get_tipo_display', read_only=True)
    participantes = serializers.SerializerMethodField()
    participo = serializers.SerializerMethodField()
    cerrada = serializers.SerializerMethodField()
    cupos_restantes = serializers.SerializerMethodField()
    ganador_nombre = serializers.SerializerMethodField()
    producto_nombre = serializers.CharField(source='producto.nombre', default=None, read_only=True)
    producto_imagen = serializers.SerializerMethodField()

    class Meta:
        model = Novedad
        fields = [
            'id', 'tipo', 'tipo_nombre', 'titulo', 'resumen', 'detalle', 'fecha', 'lugar', 'cupos',
            'cupos_restantes', 'producto', 'producto_nombre', 'producto_imagen', 'participantes', 'participo', 'cerrada',
            'ganador_nombre',
        ]

    def _inscritos(self, obj):
        return obj.participaciones.count()

    def get_participantes(self, obj):
        return self._inscritos(obj) if obj.tipo != 'nuevo' else 0

    def get_participo(self, obj):
        usuario = self.context['request'].user
        return bool(usuario.is_authenticated and obj.participaciones.filter(usuario=usuario).exists())

    def get_producto_imagen(self, obj):
        if obj.producto is None:
            return None
        return obj.producto.imagen or f'/tipos/{obj.producto.tipo}.svg'

    def get_cerrada(self, obj):
        return esta_cerrada(obj, self._inscritos(obj))

    def get_cupos_restantes(self, obj):
        if obj.cupos is None:
            return None
        return max(0, obj.cupos - self._inscritos(obj))

    def get_ganador_nombre(self, obj):
        return obj.ganador.username if obj.ganador_id else None


class NovedadViewSet(viewsets.ReadOnlyModelViewSet):
    """Cualquiera ve las novedades publicadas; para participar hay que iniciar sesión."""

    serializer_class = NovedadSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Novedad.objects.filter(publicada=True).select_related('producto', 'ganador')

    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsAuthenticated])
    def participar(self, request, pk=None):
        with transaction.atomic():
            # se bloquea la fila para que dos personas no ocupen el último cupo a la vez
            novedad = Novedad.objects.select_for_update().filter(pk=pk, publicada=True).first()
            if novedad is None:
                return Response({'detail': 'Esa novedad no existe.'}, status=status.HTTP_404_NOT_FOUND)
            if novedad.tipo == 'nuevo':
                return Response({'detail': 'Esta novedad no tiene inscripción.'}, status=status.HTTP_400_BAD_REQUEST)

            ya = Participacion.objects.filter(usuario=request.user, novedad=novedad)
            inscritos = novedad.participaciones.count()
            if request.method == 'DELETE':
                if novedad.ganador_id:
                    return Response({'detail': 'El sorteo ya tiene ganador.'}, status=status.HTTP_400_BAD_REQUEST)
                ya.delete()
            elif not ya.exists():
                if esta_cerrada(novedad, inscritos):
                    return Response({'detail': 'La inscripción ya está cerrada.'}, status=status.HTTP_409_CONFLICT)
                Participacion.objects.create(usuario=request.user, novedad=novedad)

        return Response(NovedadSerializer(novedad, context={'request': request}).data)
