import re
import unicodedata
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.management.base import BaseCommand

from catalogo.models import Producto

# Fotos de Wikimedia Commons (archivos con licencia libre) para los productos extra.
# Producto -> nombre del archivo en Commons. Los que no están aquí siguen con su ilustración.
FOTOS = {
    "Héroes de fantasía (6 miniaturas)": "Warhammer_Fantasy_RedCraig.jpg",
    "Dragón rojo sin pintar": "Warhammer_Fantasy_RedCraig.jpg",
    "Orcos guerreros (10 miniaturas)": "Warhammer_Fantasy_RedCraig.jpg",
    "Set de pinturas acrílicas (12 colores)": "Paint_brushes_(30804).jpg",
    "Pincel de detalle n.º 0": "Painting_brushes.jpg",
    "Barniz mate en frasco": "Gesso_acrylic_brush.jpg",
    "Micas transparentes estándar (100 un.)": "Sleeved_playing_card.jpg",
    "Micas mate negras (100 un.)": "Sleeved_playing_card.jpg",
    "Micas tamaño pequeño (100 un.)": "Sleeved_playing_card.jpg",
    "Peluche de meeple": "Handmade_teddy_bear.jpg",
    "Peluche de dado d20": "Zoomteddybear.jpg",
    "Taza «Una partida más»": "Coffee_mug_-_Flickr_-_Stiller_Beobachter.jpg",
    "Set de dados poliédricos (7 piezas)": "DnD_Dice_Set.jpg",
    "Dados de seis caras (12 un.)": "Würfel,_gemischt_--_2021_--_5577.jpg",
    "Dados metálicos dorados (7 piezas)": "Dice_2005.jpg",
}

ANCHO = 640
# Wikimedia pide identificarse al descargar
CABECERAS = {"User-Agent": "GambitoTienda/1.0 (proyecto academico TECSUP; Django)"}


def _nombre_local(archivo):
    sin_tildes = unicodedata.normalize("NFKD", archivo).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", Path(sin_tildes).stem.lower()).strip("-") + ".jpg"


def descargar(archivo):
    url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(archivo)}?width={ANCHO}"
    with urlopen(Request(url, headers=CABECERAS), timeout=30) as r:
        return r.read()


class Command(BaseCommand):
    help = "Descarga fotos de Wikimedia Commons para los productos extra y las asigna"

    def add_arguments(self, parser):
        carpeta = Path(settings.BASE_DIR).parent / "frontend" / "public" / "accesorios"
        parser.add_argument("--destino", default=str(carpeta), help="Carpeta donde guardar las fotos")

    def handle(self, *args, **options):
        destino = Path(options["destino"])
        destino.mkdir(parents=True, exist_ok=True)
        guardadas = {}  # archivo de Commons -> nombre local (o None si falló)
        asignadas = 0

        for nombre, archivo in FOTOS.items():
            producto = Producto.objects.filter(nombre=nombre).first()
            if producto is None or producto.imagen:
                continue  # no existe, o ya tiene portada (no se pisa)
            if archivo not in guardadas:
                local = _nombre_local(archivo)
                try:
                    (destino / local).write_bytes(descargar(archivo))
                    guardadas[archivo] = local
                    self.stdout.write(f"Descargada: {archivo}")
                except Exception as error:  # sin internet, archivo movido, etc.
                    guardadas[archivo] = None
                    self.stdout.write(self.style.WARNING(f"No se pudo bajar {archivo}: {error}"))
            if guardadas[archivo]:
                producto.imagen = f"/accesorios/{guardadas[archivo]}"
                producto.save(update_fields=["imagen"])
                asignadas += 1

        creditos = ["Fotos de Wikimedia Commons (revisa la licencia de cada una en su página):", ""]
        for archivo, local in guardadas.items():
            if local:
                creditos.append(f"{local}  <-  https://commons.wikimedia.org/wiki/File:{quote(archivo)}")
        (destino / "CREDITOS.txt").write_text("\n".join(creditos) + "\n", encoding="utf-8")
        self.stdout.write(self.style.SUCCESS(
            f"Listo: {asignadas} productos con foto. Créditos en {destino / 'CREDITOS.txt'}"
        ))
