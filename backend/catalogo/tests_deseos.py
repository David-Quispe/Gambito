from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Categoria, Deseo, Producto

User = get_user_model()


def cliente_de(usuario):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.get_or_create(user=usuario)[0].key}')
    return c


class DeseosTests(TestCase):
    def setUp(self):
        cat = Categoria.objects.create(nombre='Estrategia')
        self.catan = Producto.objects.create(nombre='Catan', descripcion='d', precio=100, stock=3, categoria=cat, ventas=4)
        self.uno = Producto.objects.create(nombre='Uno', descripcion='d', precio=20, stock=50, categoria=cat)
        self.ajedrez = Producto.objects.create(nombre='Ajedrez', descripcion='d', precio=60, stock=10, categoria=cat)
        self.ana = User.objects.create_user('ana', 'a@mail.com', 'clave-segura-123')
        self.beto = User.objects.create_user('beto', 'b@mail.com', 'clave-segura-123')
        self.admin = User.objects.create_user('jefe', 'j@mail.com', 'clave-segura-123', is_staff=True)

    def test_exige_sesion(self):
        self.assertEqual(APIClient().get('/api/deseos/').status_code, 401)
        self.assertEqual(APIClient().post('/api/deseos/', {'producto': 1}, format='json').status_code, 401)

    def test_agregar_listar_y_quitar(self):
        c = cliente_de(self.ana)
        self.assertEqual(c.post('/api/deseos/', {'producto': self.catan.id}, format='json').status_code, 201)
        # repetir no duplica
        self.assertEqual(c.post('/api/deseos/', {'producto': self.catan.id}, format='json').status_code, 200)
        self.assertEqual(Deseo.objects.filter(usuario=self.ana).count(), 1)
        lista = c.get('/api/deseos/').json()
        self.assertEqual([p['id'] for p in lista], [self.catan.id])
        self.assertEqual(c.delete(f'/api/deseos/{self.catan.id}/').status_code, 204)
        self.assertEqual(c.get('/api/deseos/').json(), [])
        # quitar algo que no estaba no falla
        self.assertEqual(c.delete(f'/api/deseos/{self.catan.id}/').status_code, 204)

    def test_producto_inexistente(self):
        self.assertEqual(cliente_de(self.ana).post('/api/deseos/', {'producto': 9999}, format='json').status_code, 404)

    def test_cada_persona_ve_solo_los_suyos(self):
        cliente_de(self.ana).post('/api/deseos/', {'producto': self.catan.id}, format='json')
        self.assertEqual(cliente_de(self.beto).get('/api/deseos/').json(), [])
        # el delete de beto no toca el deseo de ana
        cliente_de(self.beto).delete(f'/api/deseos/{self.catan.id}/')
        self.assertEqual(Deseo.objects.count(), 1)

    def test_demanda_solo_admin(self):
        self.assertEqual(APIClient().get('/api/demanda/').status_code, 401)
        self.assertEqual(cliente_de(self.ana).get('/api/demanda/').status_code, 403)

    def test_demanda_ordena_y_marca_reponer(self):
        for u in (self.ana, self.beto):
            cliente_de(u).post('/api/deseos/', {'producto': self.catan.id}, format='json')
        cliente_de(self.ana).post('/api/deseos/', {'producto': self.uno.id}, format='json')
        datos = cliente_de(self.admin).get('/api/demanda/').json()
        self.assertEqual(datos['total_deseos'], 3)
        nombres = [f['nombre'] for f in datos['productos']]
        # Ajedrez no tiene deseos ni ventas: no aparece
        self.assertEqual(nombres, ['Catan', 'Uno'])
        catan, uno = datos['productos']
        self.assertEqual((catan['deseos'], catan['ventas']), (2, 4))
        self.assertTrue(catan['reponer'])   # deseado y con stock 3
        self.assertFalse(uno['reponer'])    # stock de sobra

    def test_borrar_usuario_borra_sus_deseos(self):
        cliente_de(self.ana).post('/api/deseos/', {'producto': self.catan.id}, format='json')
        self.ana.delete()
        self.assertEqual(Deseo.objects.count(), 0)
