import tempfile
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase

from .management.commands import descargar_imagenes_extras as cmd
from .models import Producto


class DescargarImagenesTests(TestCase):
    def setUp(self):
        call_command('cargar_extras')

    def test_asigna_foto_y_no_pisa_portadas_existentes(self):
        Producto.objects.filter(nombre='Dragón rojo sin pintar').update(imagen='https://x/y.jpg')
        with tempfile.TemporaryDirectory() as carpeta, patch.object(cmd, 'descargar', return_value=b'jpg'):
            call_command('descargar_imagenes_extras', destino=carpeta)
        dado = Producto.objects.get(nombre='Dados de seis caras (12 un.)')
        self.assertTrue(dado.imagen.startswith('/accesorios/'))
        self.assertEqual(Producto.objects.get(nombre='Dragón rojo sin pintar').imagen, 'https://x/y.jpg')

    def test_si_falla_la_descarga_se_queda_la_ilustracion(self):
        with tempfile.TemporaryDirectory() as carpeta, patch.object(cmd, 'descargar', side_effect=OSError('sin red')):
            call_command('descargar_imagenes_extras', destino=carpeta)
        self.assertEqual(Producto.objects.get(nombre='Pincel de detalle n.º 0').imagen, '')

    def test_nombre_local_sin_tildes_ni_comas(self):
        self.assertEqual(cmd._nombre_local('Würfel,_gemischt_--_2021_--_5577.jpg'), 'wurfel-gemischt-2021-5577.jpg')
