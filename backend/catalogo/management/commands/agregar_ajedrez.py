from django.core.management.base import BaseCommand

from catalogo.models import Categoria, Producto

DATOS = dict(
    descripcion='El juego de estrategia más famoso del mundo: planifica, ataca y da jaque mate al rey rival.',
    precio=45,
    imagen='/juegos/ajedrez.svg',
    stock=10,
    tipo='juego',
    jugadores='2',
    duracion='20-60',
    edad='+8',
    dificultad='media',
    componentes='Tablero de 8×8\n16 piezas blancas\n16 piezas negras',
    preparacion='Coloca el tablero con una casilla blanca en la esquina inferior derecha de cada jugador.\n'
                'En la fila de atrás pon torres en las esquinas, luego caballos, alfiles, la dama en su color y el rey al lado.\n'
                'Los ocho peones van en la fila de adelante.',
    como_jugar='Las blancas mueven primero y luego se turnan.\nCada pieza se mueve distinto: la torre en recta, el alfil en diagonal, '
               'la dama en ambas, el caballo en L, el rey una casilla y el peón hacia adelante (y captura en diagonal).\n'
               'Capturas una pieza rival ocupando su casilla.\nEl enroque, la captura al paso y la coronación del peón son jugadas especiales.',
    como_ganar='Gana quien da jaque mate: el rey rival está atacado y no puede escapar.\nSi un jugador no tiene jugadas pero su rey no está en jaque, es tablas (ahogado).',
    consejos='Controla el centro del tablero desde las primeras jugadas.\nSaca tus caballos y alfiles antes de mover la dama.\n'
             'Enroca pronto para proteger a tu rey.\nAntes de mover, revisa qué pieza tuya queda sin defensa.',
)


class Command(BaseCommand):
    help = 'Agrega el juego Ajedrez al catálogo (no hace nada si ya existe). Se puede jugar contra la IA.'

    def handle(self, *args, **opciones):
        categoria, _ = Categoria.objects.get_or_create(
            nombre='Clásicos', defaults={'descripcion': 'Los juegos de tablero de toda la vida'},
        )
        _, nuevo = Producto.objects.get_or_create(nombre='Ajedrez', defaults={**DATOS, 'categoria': categoria})
        self.stdout.write('Ajedrez agregado al catálogo.' if nuevo else 'Ajedrez ya existía.')
