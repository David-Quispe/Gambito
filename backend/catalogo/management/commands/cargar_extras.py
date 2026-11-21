from django.core.management.base import BaseCommand

from catalogo.models import Categoria, Producto

# Productos que no son juegos de mesa: miniaturas, pinturas, micas, peluches, recuerdos y dados.
# No tienen portada propia: la página muestra una ilustración según su tipo.
CATEGORIA = "Accesorios"
DESCRIPCION_CATEGORIA = "Miniaturas, pinturas, dados, micas y recuerdos"

EXTRAS = [
    {"nombre": 'Héroes de fantasía (6 miniaturas)', "tipo": 'miniatura', "descripcion": 'Seis miniaturas sin pintar de guerrero, mago, arquero, ladrón, clérigo y enano para tus campañas de rol.', "precio": 79.9, "stock": 10, "descuento": 0, "ventas": 14},
    {"nombre": 'Dragón rojo sin pintar', "tipo": 'miniatura', "descripcion": 'Miniatura grande de dragón con base incluida. Ideal para el jefe final de tu aventura.', "precio": 89.9, "stock": 4, "descuento": 10, "ventas": 9},
    {"nombre": 'Orcos guerreros (10 miniaturas)', "tipo": 'miniatura', "descripcion": 'Una horda de diez orcos para armar ejércitos o encuentros de combate.', "precio": 99.9, "stock": 6, "descuento": 0, "ventas": 7},
    {"nombre": 'Set de pinturas acrílicas (12 colores)', "tipo": 'pintura', "descripcion": 'Doce colores acrílicos pensados para pintar miniaturas, con buena cobertura y secado rápido.', "precio": 69.9, "stock": 15, "descuento": 15, "ventas": 20},
    {"nombre": 'Pincel de detalle n.º 0', "tipo": 'pintura', "descripcion": 'Pincel fino para ojos, bordes y detalles pequeños de tus miniaturas.', "precio": 14.9, "stock": 30, "descuento": 0, "ventas": 18},
    {"nombre": 'Barniz mate en frasco', "tipo": 'pintura', "descripcion": 'Protege tus miniaturas ya pintadas y les quita el brillo para un acabado más realista.', "precio": 29.9, "stock": 2, "descuento": 0, "ventas": 6},
    {"nombre": 'Micas transparentes estándar (100 un.)', "tipo": 'micas', "descripcion": 'Fundas transparentes para cartas de tamaño estándar. Protegen del roce y los derrames.', "precio": 19.9, "stock": 40, "descuento": 0, "ventas": 35},
    {"nombre": 'Micas mate negras (100 un.)', "tipo": 'micas', "descripcion": 'Fundas con reverso negro mate: las cartas no se ven a trasluz y se barajan mejor.', "precio": 29.9, "stock": 25, "descuento": 10, "ventas": 22},
    {"nombre": 'Micas tamaño pequeño (100 un.)', "tipo": 'micas', "descripcion": 'Fundas para cartas pequeñas, como las de juegos de cartas rápidos y mazos compactos.', "precio": 22.9, "stock": 0, "descuento": 0, "ventas": 11},
    {"nombre": 'Peluche de meeple', "tipo": 'peluche', "descripcion": 'Peluche suave con la forma del clásico meeple de los juegos de mesa.', "precio": 39.9, "stock": 12, "descuento": 0, "ventas": 8},
    {"nombre": 'Peluche de dado d20', "tipo": 'peluche', "descripcion": 'Dado de veinte caras en versión peluche, perfecto para tener en la mesa de juego.', "precio": 34.9, "stock": 7, "descuento": 0, "ventas": 5},
    {"nombre": 'Llavero de dado d20', "tipo": 'recuerdo', "descripcion": 'Llavero metálico con forma de dado de veinte caras.', "precio": 12.9, "stock": 50, "descuento": 0, "ventas": 27},
    {"nombre": 'Taza «Una partida más»', "tipo": 'recuerdo', "descripcion": 'Taza de cerámica con el lema de todo jugador de mesa. Apta para microondas.', "precio": 29.9, "stock": 9, "descuento": 0, "ventas": 10},
    {"nombre": 'Posavasos de juegos (4 un.)', "tipo": 'recuerdo', "descripcion": 'Cuatro posavasos con ilustraciones de fichas y dados para cuidar la mesa mientras juegas.', "precio": 18.9, "stock": 14, "descuento": 0, "ventas": 6},
    {"nombre": 'Set de dados poliédricos (7 piezas)', "tipo": 'dado', "descripcion": 'Siete dados de rol (d4, d6, d8, d10, d%, d12 y d20) en una bolsita de tela.', "precio": 24.9, "stock": 30, "descuento": 0, "ventas": 40},
    {"nombre": 'Dados de seis caras (12 un.)', "tipo": 'dado', "descripcion": 'Doce dados de seis caras de colores para juegos de mesa, de cartas o de rol.', "precio": 14.9, "stock": 45, "descuento": 0, "ventas": 30},
    {"nombre": 'Dados metálicos dorados (7 piezas)', "tipo": 'dado', "descripcion": 'Set de siete dados poliédricos de metal con acabado dorado, más pesados y con buen sonido.', "precio": 59.9, "stock": 3, "descuento": 20, "ventas": 12},
]


class Command(BaseCommand):
    help = "Agrega los productos extra (no juegos) sin tocar los que ya existen"

    def handle(self, *args, **options):
        categoria, _ = Categoria.objects.get_or_create(
            nombre=CATEGORIA, defaults={"descripcion": DESCRIPCION_CATEGORIA}
        )
        nuevos = 0
        for datos in EXTRAS:
            nombre = datos.pop("nombre")
            # get_or_create: si ya existe (o el admin lo editó) no se pisa
            _, creado = Producto.objects.get_or_create(
                nombre=nombre, defaults={**datos, "categoria": categoria, "imagen": ""}
            )
            datos["nombre"] = nombre
            nuevos += creado
        self.stdout.write(self.style.SUCCESS(
            f"Extras: {nuevos} nuevos, {len(EXTRAS) - nuevos} ya existían."
        ))
