from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase

from .management.commands.asignar_imagenes_extras import FOTOS
from .models import Producto


class AsignarImagenesTests(TestCase):
    def setUp(self):
        call_command('cargar_extras')

    def test_asigna_foto_y_no_pisa_portadas_existentes(self):
        Producto.objects.filter(nombre='Dragón rojo sin pintar').update(imagen='https://x/y.jpg')
        call_command('asignar_imagenes_extras')
        dado = Producto.objects.get(nombre='Dados de seis caras (12 un.)')
        self.assertEqual(dado.imagen, '/accesorios/dados-seis-caras.jpg')
        self.assertEqual(Producto.objects.get(nombre='Dragón rojo sin pintar').imagen, 'https://x/y.jpg')

    def test_todos_los_extras_tienen_foto(self):
        call_command('asignar_imagenes_extras')
        self.assertFalse(Producto.objects.filter(categoria__nombre='Accesorios', imagen='').exists())

    def test_los_archivos_existen_en_el_frontend(self):
        carpeta = Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'accesorios'
        for archivo in FOTOS.values():
            self.assertTrue((carpeta / f'{archivo}.jpg').exists(), archivo)
