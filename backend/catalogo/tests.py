import io

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Categoria, Producto


class TiendaApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        est = Categoria.objects.create(nombre='Estrategia')
        par = Categoria.objects.create(nombre='Party')
        crear = lambda **kw: Producto.objects.create(
            descripcion='d', imagen='http://x/y.png', jugadores='2-4',
            duracion='30', edad='+10', **kw,
        )
        self.catan = crear(nombre='Catan', precio=200, descuento=25, stock=5, ventas=50, categoria=est)
        self.root = crear(nombre='Root', precio=250, descuento=0, stock=2, ventas=10, categoria=est)
        self.dobble = crear(nombre='Dobble', precio=60, descuento=0, stock=0, ventas=70, categoria=par)
        self.uno = crear(nombre='Uno', precio=40, descuento=10, stock=9, ventas=80, categoria=par)

    def entrar_como_admin(self):
        admin = get_user_model().objects.create_user('admin', password='x', is_staff=True)
        self.client.force_authenticate(admin)

    def nombres(self, url):
        return [p['nombre'] for p in self.client.get(url).json()]

    def test_precio_final_con_descuento(self):
        self.assertEqual(float(self.catan.precio_final), 150.0)
        self.assertTrue(self.catan.en_oferta)
        self.assertTrue(self.root.stock_bajo)

    def test_busqueda_por_nombre(self):
        self.assertEqual(self.nombres('/api/productos/?buscar=cat'), ['Catan'])

    def test_filtro_categoria_y_oferta(self):
        self.assertEqual(self.nombres('/api/productos/?categoria=Party&oferta=1'), ['Uno'])

    def test_filtro_disponible(self):
        self.assertNotIn('Dobble', self.nombres('/api/productos/?disponible=1'))

    def test_filtro_precio_usa_precio_final(self):
        # Catan cuesta 200 pero con 25 % queda en 150
        self.assertEqual(self.nombres('/api/productos/?precio_max=150&categoria=Estrategia'), ['Catan'])

    def test_orden_por_precio(self):
        self.assertEqual(
            self.nombres('/api/productos/?orden=precio_asc'),
            ['Uno', 'Dobble', 'Catan', 'Root'],
        )

    def test_comprador_no_puede_cambiar_stock_ni_ver_inventario(self):
        r = self.client.post(f'/api/productos/{self.root.id}/ajustar-stock/', {'cantidad': 4}, format='json')
        self.assertIn(r.status_code, (401, 403))
        self.assertIn(self.client.get('/api/productos/inventario/').status_code, (401, 403))
        self.root.refresh_from_db()
        self.assertEqual(self.root.stock, 2)

    def test_ajustar_stock(self):
        self.entrar_como_admin()
        r = self.client.post(f'/api/productos/{self.root.id}/ajustar-stock/', {'cantidad': 4}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['stock'], 6)

    def test_ajustar_stock_no_permite_negativos(self):
        self.entrar_como_admin()
        r = self.client.post(f'/api/productos/{self.root.id}/ajustar-stock/', {'cantidad': -9}, format='json')
        self.assertEqual(r.status_code, 400)
        self.root.refresh_from_db()
        self.assertEqual(self.root.stock, 2)

    def test_resumen_inventario(self):
        self.entrar_como_admin()
        datos = self.client.get('/api/productos/inventario/').json()
        self.assertEqual(datos['total_productos'], 4)
        self.assertEqual(datos['agotados'], 1)
        self.assertEqual(datos['stock_bajo'], 1)
        self.assertEqual(datos['en_oferta'], 2)

    def test_recomendaciones_misma_categoria_primero_y_sin_agotados(self):
        r = self.nombres(f'/api/productos/{self.catan.id}/recomendaciones/')
        self.assertEqual(r[0], 'Root')          # misma categoría
        self.assertNotIn('Dobble', r)           # agotado
        self.assertNotIn('Catan', r)            # no se recomienda a sí mismo

    def test_recomendados_inicio(self):
        r = self.nombres('/api/productos/recomendados/')
        self.assertEqual(r[0], 'Uno')
        self.assertNotIn('Dobble', r)


class CuentasTests(TestCase):
    def setUp(self):
        cache.clear()  # el límite de intentos usa la caché
        self.client = APIClient()

    def registrar(self, **extra):
        datos = {'username': 'ana', 'email': 'Ana@Correo.com', 'password': 'Clave-segura-91'}
        datos.update(extra)
        return self.client.post('/api/auth/registro/', datos, format='json')

    def test_registro_crea_comprador_y_devuelve_token(self):
        r = self.registrar()
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.json()['token'])
        self.assertFalse(r.json()['usuario']['es_admin'])
        self.assertEqual(r.json()['usuario']['email'], 'ana@correo.com')

    def test_registro_no_acepta_es_admin_ni_is_staff(self):
        r = self.registrar(is_staff=True, is_superuser=True, es_admin=True)
        self.assertFalse(r.json()['usuario']['es_admin'])
        self.assertFalse(get_user_model().objects.get(username='ana').is_staff)

    def test_registro_rechaza_usuario_o_correo_repetido(self):
        self.registrar()
        self.assertEqual(self.registrar(email='otro@correo.com').status_code, 400)
        self.assertEqual(self.registrar(username='otra').status_code, 400)
        self.assertEqual(self.registrar(username='ANA', email='x@x.com').status_code, 400)

    def test_registro_rechaza_contrasena_debil(self):
        self.assertEqual(self.registrar(password='123').status_code, 400)
        self.assertEqual(self.registrar(password='12345678').status_code, 400)

    def test_login_con_usuario_y_con_correo(self):
        self.registrar()
        for ident in ('ana', 'ANA@correo.com'):
            r = self.client.post('/api/auth/login/', {'identificador': ident, 'password': 'Clave-segura-91'}, format='json')
            self.assertEqual(r.status_code, 200, ident)
            self.assertTrue(r.json()['token'])

    def test_login_con_datos_malos(self):
        self.registrar()
        r = self.client.post('/api/auth/login/', {'identificador': 'ana', 'password': 'mala'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertNotIn('token', r.json())

    def test_yo_y_logout(self):
        token = self.registrar().json()['token']
        self.assertEqual(self.client.get('/api/auth/yo/').status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(self.client.get('/api/auth/yo/').json()['username'], 'ana')
        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 204)
        self.assertEqual(self.client.get('/api/auth/yo/').status_code, 401)

    def test_comprador_con_token_no_toca_el_stock_pero_el_admin_si(self):
        cat = Categoria.objects.create(nombre='X')
        p = Producto.objects.create(
            nombre='Juego', descripcion='d', precio=10, imagen='http://x/y.png',
            stock=5, categoria=cat, jugadores='2', duracion='10', edad='+8',
        )
        url = f'/api/productos/{p.id}/ajustar-stock/'

        token = self.registrar().json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(self.client.post(url, {'cantidad': 1}, format='json').status_code, 403)

        from django.core.management import call_command
        call_command('crear_admin', password='Admin-clave-2026', stdout=io.StringIO())
        r = self.client.post('/api/auth/login/', {'identificador': 'admin', 'password': 'Admin-clave-2026'}, format='json')
        self.assertTrue(r.json()['usuario']['es_admin'])
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {r.json()['token']}")
        self.assertEqual(self.client.post(url, {'cantidad': 1}, format='json').json()['stock'], 6)
