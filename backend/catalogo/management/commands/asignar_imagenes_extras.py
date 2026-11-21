from django.core.management.base import BaseCommand

from catalogo.models import Producto

# Nombre del producto -> foto guardada en frontend/public/accesorios/
FOTOS = {
    'Héroes de fantasía (6 miniaturas)': 'heroes-fantasia',
    'Dragón rojo sin pintar': 'dragon-rojo',
    'Orcos guerreros (10 miniaturas)': 'orcos-guerreros',
    'Set de pinturas acrílicas (12 colores)': 'pinturas-acrilicas',
    'Pincel de detalle n.º 0': 'pincel-detalle',
    'Barniz mate en frasco': 'barniz-mate',
    'Micas transparentes estándar (100 un.)': 'micas-transparentes',
    'Micas mate negras (100 un.)': 'micas-negras',
    'Micas tamaño pequeño (100 un.)': 'micas-pequenas',
    'Peluche de meeple': 'peluche-meeple',
    'Peluche de dado d20': 'peluche-d20',
    'Llavero de dado d20': 'llavero-d20',
    'Taza «Una partida más»': 'taza-una-partida-mas',
    'Posavasos de juegos (4 un.)': 'posavasos',
    'Set de dados poliédricos (7 piezas)': 'dados-poliedricos',
    'Dados de seis caras (12 un.)': 'dados-seis-caras',
    'Dados metálicos dorados (7 piezas)': 'dados-dorados',
}


class Command(BaseCommand):
    help = (
        'Asigna a los accesorios sus fotos de /accesorios. Rellena las vacías y corrige '
        'rutas viejas de /accesorios/, pero no toca enlaces https puestos a mano.'
    )

    def handle(self, *args, **opciones):
        asignadas = 0
        for nombre, archivo in FOTOS.items():
            ruta = f'/accesorios/{archivo}.jpg'
            candidatos = Producto.objects.filter(nombre=nombre).exclude(imagen=ruta)
            vacios = candidatos.filter(imagen='') | candidatos.filter(imagen__startswith='/accesorios/')
            asignadas += vacios.update(imagen=ruta)
        self.stdout.write(self.style.SUCCESS(f'Imágenes asignadas: {asignadas}'))
