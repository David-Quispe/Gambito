from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Novedad, Participacion

User = get_user_model()


def cliente_de(usuario):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.get_or_create(user=usuario)[0].key}')
    return c


class NovedadesTests(TestCase):
    def setUp(self):
        manana = timezone.now() + timedelta(days=1)
        self.torneo = Novedad.objects.create(tipo='torneo', titulo='Torneo', resumen='r', fecha=manana, cupos=1)
        self.sorteo = Novedad.objects.create(tipo='sorteo', titulo='Sorteo', resumen='r', fecha=manana)
        self.nuevo = Novedad.objects.create(tipo='nuevo', titulo='Nuevo', resumen='r')
        self.oculta = Novedad.objects.create(tipo='nuevo', titulo='Borrador', resumen='r', publicada=False)
        self.ana = User.objects.create_user('ana', 'a@mail.com', 'clave-segura-123')
        self.beto = User.objects.create_user('beto', 'b@mail.com', 'clave-segura-123')

    def test_lista_publica_sin_ocultas(self):
        datos = APIClient().get('/api/novedades/').json()
        self.assertEqual({n['titulo'] for n in datos}, {'Torneo', 'Sorteo', 'Nuevo'})

    def test_participar_exige_sesion(self):
        self.assertEqual(APIClient().post(f'/api/novedades/{self.sorteo.id}/participar/').status_code, 401)

    def test_participar_y_salirse(self):
        c = cliente_de(self.ana)
        r = c.post(f'/api/novedades/{self.sorteo.id}/participar/')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()['participo'])
        self.assertEqual(r.json()['participantes'], 1)
        # repetir no duplica
        c.post(f'/api/novedades/{self.sorteo.id}/participar/')
        self.assertEqual(Participacion.objects.count(), 1)
        r = c.delete(f'/api/novedades/{self.sorteo.id}/participar/')
        self.assertFalse(r.json()['participo'])
        self.assertEqual(Participacion.objects.count(), 0)

    def test_cupos_llenos(self):
        self.assertEqual(cliente_de(self.ana).post(f'/api/novedades/{self.torneo.id}/participar/').status_code, 200)
        r = cliente_de(self.beto).post(f'/api/novedades/{self.torneo.id}/participar/')
        self.assertEqual(r.status_code, 409)
        datos = APIClient().get('/api/novedades/').json()
        torneo = next(n for n in datos if n['id'] == self.torneo.id)
        self.assertTrue(torneo['cerrada'])
        self.assertEqual(torneo['cupos_restantes'], 0)

    def test_no_se_participa_en_juego_nuevo_ni_oculta(self):
        c = cliente_de(self.ana)
        self.assertEqual(c.post(f'/api/novedades/{self.nuevo.id}/participar/').status_code, 400)
        self.assertEqual(c.post(f'/api/novedades/{self.oculta.id}/participar/').status_code, 404)

    def test_evento_pasado_cerrado(self):
        self.sorteo.fecha = timezone.now() - timedelta(days=1)
        self.sorteo.save()
        self.assertEqual(cliente_de(self.ana).post(f'/api/novedades/{self.sorteo.id}/participar/').status_code, 409)

    def test_sorteo_en_admin_elige_un_inscrito(self):
        from django.contrib.admin.sites import site
        from django.contrib.messages.storage.fallback import FallbackStorage
        from django.test import RequestFactory

        Participacion.objects.create(usuario=self.ana, novedad=self.sorteo)
        Participacion.objects.create(usuario=self.beto, novedad=self.sorteo)
        peticion = RequestFactory().post('/')
        peticion.session = {}
        peticion._messages = FallbackStorage(peticion)
        admin = site._registry[Novedad]
        admin.sortear_ganador(peticion, Novedad.objects.filter(pk=self.sorteo.pk))
        self.sorteo.refresh_from_db()
        self.assertIn(self.sorteo.ganador, (self.ana, self.beto))
        datos = APIClient().get('/api/novedades/').json()
        sorteo = next(n for n in datos if n['id'] == self.sorteo.id)
        self.assertTrue(sorteo['cerrada'])
        self.assertEqual(sorteo['ganador_nombre'], self.sorteo.ganador.username)

    def test_comando_de_ejemplos_no_duplica(self):
        Novedad.objects.all().delete()
        call_command('cargar_novedades')
        call_command('cargar_novedades')
        self.assertEqual(Novedad.objects.count(), 4)

    def test_trae_la_imagen_del_juego_vinculado(self):
        from .models import Categoria, Producto

        juego = Producto.objects.create(
            nombre='Azul', descripcion='d', precio=50, stock=3, categoria=Categoria.objects.create(nombre='Familiar'),
            imagen='/juegos/azul.svg',
        )
        self.sorteo.producto = juego
        self.sorteo.save()
        datos = APIClient().get('/api/novedades/').json()
        sorteo = next(n for n in datos if n['id'] == self.sorteo.id)
        self.assertEqual(sorteo['producto_imagen'], '/juegos/azul.svg')
        self.assertEqual(sorteo['producto_nombre'], 'Azul')
        torneo = next(n for n in datos if n['id'] == self.torneo.id)
        self.assertIsNone(torneo['producto_imagen'])
