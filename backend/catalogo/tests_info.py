from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .management.commands.info_juegos import INFO
from .models import Producto
from .serializers import id_de_youtube


class InfoAmpliadaTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        call_command('cargar_datos')
        call_command('cargar_extras')

    def test_carga_la_info_de_todos_los_juegos(self):
        call_command('cargar_info_juegos')
        for nombre in INFO:
            juego = Producto.objects.get(nombre=nombre)
            self.assertTrue(juego.como_jugar, nombre)
            self.assertTrue(juego.como_ganar, nombre)
            self.assertTrue(id_de_youtube(juego.video), nombre)

    def test_no_pisa_lo_que_el_admin_ya_edito(self):
        Producto.objects.filter(nombre='Catan').update(como_ganar='Texto mío')
        call_command('cargar_info_juegos')
        self.assertEqual(Producto.objects.get(nombre='Catan').como_ganar, 'Texto mío')
        self.assertTrue(Producto.objects.get(nombre='Catan').preparacion)

    def test_api_devuelve_la_info_y_el_id_del_video(self):
        call_command('cargar_info_juegos')
        catan = next(p for p in self.client.get('/api/productos/').json() if p['nombre'] == 'Catan')
        self.assertEqual(catan['dificultad'], 'media')
        self.assertEqual(catan['dificultad_nombre'], 'Media')
        self.assertEqual(catan['video_id'], 'RiPHW2NDvuw')
        self.assertIn('\n', catan['como_jugar'])

    def test_accesorios_no_traen_info_de_juego(self):
        call_command('cargar_info_juegos')
        dado = next(p for p in self.client.get('/api/productos/').json() if p['tipo'] == 'dado')
        self.assertEqual(dado['como_jugar'], '')
        self.assertEqual(dado['video_id'], '')

    def test_id_de_youtube_acepta_varios_formatos(self):
        esperado = 'RiPHW2NDvuw'
        for enlace in (
            'https://www.youtube.com/watch?v=RiPHW2NDvuw',
            'https://youtu.be/RiPHW2NDvuw?t=3',
            'https://www.youtube.com/embed/RiPHW2NDvuw',
            'RiPHW2NDvuw',
        ):
            self.assertEqual(id_de_youtube(enlace), esperado, enlace)
        self.assertEqual(id_de_youtube(''), '')
        self.assertEqual(id_de_youtube('no es un enlace'), '')


class AgregarDamasTests(TestCase):
    def test_crea_damas_una_sola_vez(self):
        from django.core.management import call_command

        call_command('agregar_damas')
        call_command('agregar_damas')
        self.assertEqual(Producto.objects.filter(nombre='Damas').count(), 1)
        damas = Producto.objects.get(nombre='Damas')
        self.assertEqual(damas.tipo, 'juego')
        self.assertEqual(damas.categoria.nombre, 'Clásicos')
