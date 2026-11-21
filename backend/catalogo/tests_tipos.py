from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Categoria, Producto


class TiposDeProductoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cat = Categoria.objects.create(nombre='Estrategia')
        Producto.objects.create(
            nombre='Catan', descripcion='d', imagen='http://x/y.png', precio=100, stock=5,
            categoria=cat, jugadores='3-4', duracion='60', edad='+10',
        )

    def test_producto_existente_es_juego_por_defecto(self):
        datos = self.client.get('/api/productos/').json()
        self.assertEqual(datos[0]['tipo'], 'juego')
        self.assertEqual(datos[0]['tipo_nombre'], 'Juegos')

    def test_cargar_extras_agrega_productos_y_no_se_duplica(self):
        call_command('cargar_extras')
        total = Producto.objects.count()
        call_command('cargar_extras')
        self.assertEqual(Producto.objects.count(), total)
        self.assertGreater(total, 1)

    def test_filtro_por_tipo(self):
        call_command('cargar_extras')
        dados = self.client.get('/api/productos/?tipo=dado').json()
        self.assertTrue(dados)
        self.assertTrue(all(p['tipo'] == 'dado' for p in dados))
        juegos = self.client.get('/api/productos/?tipo=juego').json()
        self.assertEqual([p['nombre'] for p in juegos], ['Catan'])
        todos = self.client.get('/api/productos/?tipo=todos').json()
        self.assertGreater(len(todos), len(juegos))

    def test_extra_sin_portada_usa_ilustracion_del_tipo(self):
        call_command('cargar_extras')
        dado = self.client.get('/api/productos/?tipo=dado').json()[0]
        self.assertEqual(dado['imagen'], '/tipos/dado.svg')
        self.assertEqual(dado['jugadores'], '')
