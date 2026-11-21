from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Categoria, Pedido, Producto

User = get_user_model()

DATOS = {'nombre': 'David Quispe', 'direccion': 'Av. Siempre Viva 123, Arequipa', 'metodo': 'yape'}


class PedidosTests(TestCase):
    def setUp(self):
        cat = Categoria.objects.create(nombre='Estrategia')
        self.catan = Producto.objects.create(
            nombre='Catan', descripcion='d', precio=100, stock=5, categoria=cat, descuento=10, ventas=2,
        )
        self.uno = Producto.objects.create(nombre='Uno', descripcion='d', precio=20, stock=2, categoria=cat)
        self.usuario = User.objects.create_user('david', 'd@mail.com', 'clave-segura-123')
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.usuario).key}')

    def comprar(self, items, **extra):
        return self.client.post('/api/pedidos/', {'items': items, **DATOS, **extra}, format='json')

    def test_exige_iniciar_sesion(self):
        anonimo = APIClient()
        self.assertEqual(anonimo.post('/api/pedidos/', {}, format='json').status_code, 401)
        self.assertEqual(anonimo.get('/api/pedidos/').status_code, 401)

    def test_compra_descuenta_stock_suma_ventas_y_usa_precio_con_descuento(self):
        r = self.comprar([{'producto': self.catan.id, 'cantidad': 2}, {'producto': self.uno.id, 'cantidad': 1}])
        self.assertEqual(r.status_code, 201, r.content)
        datos = r.json()
        # Catan 100 con -10% = 90, por 2 = 180, más Uno 20 = 200
        self.assertEqual(datos['total'], 200.0)
        self.assertEqual(datos['estado'], 'pagado')
        self.assertEqual(len(datos['items']), 2)
        self.catan.refresh_from_db()
        self.uno.refresh_from_db()
        self.assertEqual((self.catan.stock, self.catan.ventas), (3, 4))
        self.assertEqual(self.uno.stock, 1)

    def test_sin_stock_suficiente_no_cambia_nada(self):
        r = self.comprar([{'producto': self.catan.id, 'cantidad': 1}, {'producto': self.uno.id, 'cantidad': 3}])
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.json()['faltantes'][0]['disponible'], 2)
        self.catan.refresh_from_db()
        self.assertEqual(self.catan.stock, 5)  # el pedido es todo o nada
        self.assertEqual(Pedido.objects.count(), 0)

    def test_producto_repetido_suma_cantidades(self):
        r = self.comprar([{'producto': self.uno.id, 'cantidad': 1}, {'producto': self.uno.id, 'cantidad': 2}])
        self.assertEqual(r.status_code, 409)  # 3 > 2 disponibles

    def test_no_se_puede_pedir_cantidad_cero_ni_producto_inexistente(self):
        self.assertEqual(self.comprar([{'producto': self.uno.id, 'cantidad': 0}]).status_code, 400)
        self.assertEqual(self.comprar([{'producto': 9999, 'cantidad': 1}]).status_code, 400)
        self.assertEqual(self.comprar([]).status_code, 400)

    def test_tarjeta_rechazada_no_descuenta_stock(self):
        r = self.comprar([{'producto': self.uno.id, 'cantidad': 1}], metodo='tarjeta', tarjeta_final='0002')
        self.assertEqual(r.status_code, 402)
        self.uno.refresh_from_db()
        self.assertEqual(self.uno.stock, 2)
        self.assertEqual(Pedido.objects.count(), 0)

    def test_tarjeta_aprobada_guarda_solo_los_ultimos_digitos(self):
        r = self.comprar([{'producto': self.uno.id, 'cantidad': 1}], metodo='tarjeta', tarjeta_final='4242')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()['referencia_pago'], 'Tarjeta terminada en 4242')

    def test_tarjeta_exige_los_ultimos_digitos(self):
        r = self.comprar([{'producto': self.uno.id, 'cantidad': 1}], metodo='tarjeta')
        self.assertEqual(r.status_code, 400)

    def test_contraentrega_queda_pendiente(self):
        r = self.comprar([{'producto': self.uno.id, 'cantidad': 1}], metodo='contraentrega')
        self.assertEqual(r.json()['estado'], 'pendiente')

    def test_cada_persona_ve_solo_sus_pedidos(self):
        self.comprar([{'producto': self.uno.id, 'cantidad': 1}])
        otra = User.objects.create_user('ana', 'a@mail.com', 'clave-segura-123')
        cliente = APIClient()
        cliente.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=otra).key}')
        self.assertEqual(cliente.get('/api/pedidos/').json(), [])
        pedido = Pedido.objects.get()
        self.assertEqual(cliente.get(f'/api/pedidos/{pedido.id}/').status_code, 404)
        self.assertEqual(len(self.client.get('/api/pedidos/').json()), 1)

    def test_cancelar_devuelve_el_stock_una_sola_vez(self):
        self.comprar([{'producto': self.catan.id, 'cantidad': 2}])
        pedido = Pedido.objects.get()
        self.assertTrue(pedido.cancelar())
        self.assertFalse(pedido.cancelar())
        self.catan.refresh_from_db()
        self.assertEqual((self.catan.stock, self.catan.ventas), (5, 2))

    def test_el_precio_guardado_no_cambia_si_despues_sube(self):
        self.comprar([{'producto': self.catan.id, 'cantidad': 1}])
        Producto.objects.filter(pk=self.catan.pk).update(precio=500)
        self.assertEqual(self.client.get('/api/pedidos/').json()[0]['items'][0]['precio_unitario'], 90.0)
