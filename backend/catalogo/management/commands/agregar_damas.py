from django.core.management.base import BaseCommand

from catalogo.models import Categoria, Producto

DATOS = dict(
    descripcion='El clásico de tablero para dos: mueve en diagonal, come las piezas rivales y corona tus damas.',
    precio=25,
    imagen='/juegos/damas.svg',
    stock=12,
    tipo='juego',
    jugadores='2',
    duracion='15-30',
    edad='+6',
    dificultad='facil',
    componentes='Tablero de 8×8\n12 fichas blancas\n12 fichas negras',
    preparacion='Coloca el tablero con una casilla oscura en la esquina inferior izquierda de cada jugador.\n'
                'Pon tus 12 fichas sobre las casillas oscuras de las tres filas más cercanas a ti.',
    como_jugar='Las blancas empiezan y se turnan.\nMueve una ficha en diagonal a una casilla libre, siempre hacia adelante.\n'
               'Si tienes una ficha rival en diagonal con una casilla libre detrás, debes saltarla y comerla.\n'
               'Si después de comer puedes seguir comiendo con la misma ficha, encadena las capturas.',
    como_ganar='Gana quien deja al rival sin fichas o sin movimientos posibles.',
    consejos='Mantén tus fichas juntas para que no te las coman.\nGuarda la fila de atrás todo lo que puedas para evitar coronas rivales.\n'
             'Una ficha coronada se mueve también hacia atrás: úsala para limpiar el tablero.',
)


class Command(BaseCommand):
    help = 'Agrega el juego Damas al catálogo (no hace nada si ya existe). Se puede jugar contra el bot.'

    def handle(self, *args, **opciones):
        categoria, _ = Categoria.objects.get_or_create(
            nombre='Clásicos', defaults={'descripcion': 'Los juegos de tablero de toda la vida'},
        )
        _, nuevo = Producto.objects.get_or_create(nombre='Damas', defaults={**DATOS, 'categoria': categoria})
        self.stdout.write('Damas agregado al catálogo.' if nuevo else 'Damas ya existía.')
