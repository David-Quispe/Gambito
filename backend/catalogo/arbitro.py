"""Árbitro IA (responde dudas de reglas de un juego) y jugadas de la IA para el ajedrez."""
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import ia
from .models import Producto

MAX_HISTORIAL = 8  # mensajes anteriores que se reenvían para dar contexto


def instrucciones_del_juego(p):
    """Texto con todo lo que la tienda sabe del juego; es lo único que la IA debe usar como fuente."""
    partes = [f'Juego: {p.nombre}. {p.descripcion}']
    if p.jugadores:
        partes.append(f'Jugadores: {p.jugadores}. Duración: {p.duracion} min. Edad: {p.edad}.')
    for titulo, texto in (
        ('Componentes', p.componentes), ('Preparación', p.preparacion), ('Cómo se juega', p.como_jugar),
        ('Cómo se gana', p.como_ganar), ('Consejos', p.consejos),
    ):
        if texto:
            partes.append(f'{titulo}:\n{texto}')
    return '\n\n'.join(partes)


class ArbitroEntrada(serializers.Serializer):
    producto = serializers.IntegerField()
    pregunta = serializers.CharField(max_length=400)
    historial = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True, max_length=40,
    )


class ArbitroView(APIView):
    """POST {producto, pregunta, historial?} → {respuesta}. Solo con sesión iniciada y con límite por hora."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ia'

    def post(self, request):
        entrada = ArbitroEntrada(data=request.data)
        entrada.is_valid(raise_exception=True)
        datos = entrada.validated_data
        producto = Producto.objects.filter(pk=datos['producto'], tipo='juego').first()
        if producto is None:
            return Response({'detail': 'Ese juego no existe.'}, status=status.HTTP_404_NOT_FOUND)

        sistema = (
            'Eres el árbitro de la tienda de juegos de mesa Gambito. Respondes en español, claro y breve '
            '(máximo 6 líneas), con tono amable. Usa SOLO la información del juego que aparece abajo; si la pregunta '
            'no se puede resolver con ella, dilo y sugiere revisar el manual de la caja en lugar de inventar reglas. '
            'Si te piden otra cosa que no sea sobre este juego, responde que solo puedes ayudar con sus reglas.\n\n'
            + instrucciones_del_juego(producto)
        )
        mensajes = []
        for m in datos.get('historial', [])[-MAX_HISTORIAL:]:
            rol = 'ia' if m.get('rol') == 'ia' else 'usuario'
            texto = str(m.get('texto', ''))[:600]
            if texto:
                mensajes.append({'rol': rol, 'texto': texto})
        mensajes.append({'rol': 'usuario', 'texto': datos['pregunta']})
        try:
            respuesta = ia.generar(sistema, mensajes)
        except ia.ErrorIA as e:
            return Response({'detail': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'respuesta': respuesta})


class JugadaEntrada(serializers.Serializer):
    juego = serializers.ChoiceField(choices=['ajedrez'])
    posicion = serializers.CharField(max_length=120)  # FEN
    legales = serializers.ListField(child=serializers.CharField(max_length=8), min_length=1, max_length=120)
    historial = serializers.CharField(max_length=1200, required=False, allow_blank=True)


class JugadaIAView(APIView):
    """El navegador calcula las jugadas legales; la IA solo elige una de esa lista (no puede inventar jugadas)."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ia'

    def post(self, request):
        entrada = JugadaEntrada(data=request.data)
        entrada.is_valid(raise_exception=True)
        d = entrada.validated_data
        sistema = (
            'Eres un jugador de ajedrez de nivel intermedio que juega con las negras. Recibes la posición en FEN '
            'y la lista de jugadas legales en notación de coordenadas (ej. e7e5, g8f6, e7e8q). '
            'Elige la mejor jugada de la lista. Responde SOLO con esa jugada, sin explicar nada.'
        )
        texto = f"Posición (FEN): {d['posicion']}\nJugadas hechas: {d.get('historial') or 'ninguna'}\n"
        texto += f"Jugadas legales: {' '.join(d['legales'])}\nTu jugada:"
        try:
            respuesta = ia.generar(sistema, [{'rol': 'usuario', 'texto': texto}], temperatura=0.3, max_tokens=20)
        except ia.ErrorIA as e:
            return Response({'detail': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        legales = set(d['legales'])
        for palabra in respuesta.replace(',', ' ').replace('.', ' ').split():
            if palabra.lower() in legales:
                return Response({'jugada': palabra.lower()})
        return Response({'detail': 'La IA eligió una jugada que no es legal.'}, status=status.HTTP_502_BAD_GATEWAY)
