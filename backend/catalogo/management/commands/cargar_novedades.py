from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from catalogo.models import Novedad, Producto

# Novedades de ejemplo para que la sección no salga vacía. Se pueden editar en el admin.
EJEMPLOS = [
    dict(tipo='torneo', titulo='Torneo de Catan en la tienda', dias=10, lugar='Tienda Gambito, Arequipa', cupos=16,
         resumen='Mesas de 4 jugadores, eliminatoria y premio para el campeón.',
         detalle='Llega 15 minutos antes. Las reglas son las del juego base y las partidas duran unos 75 minutos. '
                 'El campeón se lleva un vale de compra.', juego='Catan'),
    dict(tipo='torneo', titulo='Noche de ajedrez rápido', dias=17, lugar='Tienda Gambito, Arequipa', cupos=12,
         resumen='Partidas de 10 minutos, tablero y reloj incluidos.', detalle='Formato suizo a 5 rondas.', juego=None),
    dict(tipo='sorteo', titulo='Sorteo de un juego sorpresa', dias=21, lugar='', cupos=None,
         resumen='Inscríbete y participa por un juego de mesa a elección del ganador.',
         detalle='El sorteo se realiza al cerrar la inscripción. El ganador aparecerá aquí.', juego=None),
    dict(tipo='nuevo', titulo='Llegaron nuevos juegos de estrategia', dias=None, lugar='', cupos=None,
         resumen='Ya están en el catálogo los últimos ingresos de la semana.',
         detalle='Revisa la categoría Estrategia para verlos.', juego=None),
]


class Command(BaseCommand):
    help = 'Crea novedades de ejemplo (no duplica las que ya existen por título).'

    def handle(self, *args, **opciones):
        creadas = 0
        for e in EJEMPLOS:
            fecha = timezone.now() + timedelta(days=e['dias']) if e['dias'] else None
            producto = Producto.objects.filter(nombre__iexact=e['juego']).first() if e['juego'] else None
            _, nueva = Novedad.objects.get_or_create(
                titulo=e['titulo'],
                defaults=dict(tipo=e['tipo'], resumen=e['resumen'], detalle=e['detalle'], fecha=fecha,
                              lugar=e['lugar'], cupos=e['cupos'], producto=producto),
            )
            creadas += nueva
        self.stdout.write(f'Novedades: {creadas} nuevas, {len(EJEMPLOS) - creadas} ya existían.')
