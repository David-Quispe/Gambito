import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from . import ia
from .models import Categoria, Producto

User = get_user_model()


class IaTests(TestCase):
    def setUp(self):
        cache.clear()
        cat = Categoria.objects.create(nombre='Estrategia')
        self.catan = Producto.objects.create(
            nombre='Catan', descripcion='d', precio=100, stock=5, categoria=cat,
            como_jugar='Tira los dados\nProduce recursos', como_ganar='10 puntos',
        )
        self.dado = Producto.objects.create(nombre='D20', descripcion='d', precio=5, stock=5, categoria=cat, tipo='dados')
        self.ana = User.objects.create_user('ana', 'a@mail.com', 'clave-segura-123')
        self.c = APIClient()
        self.c.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.ana).key}')

    def test_arbitro_exige_sesion(self):
        self.assertEqual(APIClient().post('/api/arbitro/', {}, format='json').status_code, 401)

    @patch('catalogo.arbitro.ia.generar', return_value='Primero tiras los dados.')
    def test_arbitro_responde_con_las_reglas_del_juego(self, falso):
        r = self.c.post('/api/arbitro/', {'producto': self.catan.id, 'pregunta': '¿Qué hago primero?'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['respuesta'], 'Primero tiras los dados.')
        sistema = falso.call_args.args[0]
        self.assertIn('Tira los dados', sistema)
        self.assertIn('10 puntos', sistema)

    def test_arbitro_solo_para_juegos(self):
        r = self.c.post('/api/arbitro/', {'producto': self.dado.id, 'pregunta': 'hola'}, format='json')
        self.assertEqual(r.status_code, 404)

    def test_arbitro_valida_la_pregunta(self):
        self.assertEqual(self.c.post('/api/arbitro/', {'producto': self.catan.id, 'pregunta': ''}, format='json').status_code, 400)
        largo = 'a' * 401
        self.assertEqual(self.c.post('/api/arbitro/', {'producto': self.catan.id, 'pregunta': largo}, format='json').status_code, 400)

    @patch('catalogo.arbitro.ia.generar', side_effect=ia.ErrorIA('Sin clave.'))
    def test_error_de_la_ia_es_un_503_con_mensaje(self, _):
        r = self.c.post('/api/arbitro/', {'producto': self.catan.id, 'pregunta': 'hola'}, format='json')
        self.assertEqual(r.status_code, 503)
        self.assertEqual(r.json()['detail'], 'Sin clave.')

    def test_sin_clave_no_intenta_conectarse(self):
        ia._modelo_que_funciona = None
        with patch.dict(os.environ, {'GEMINI_API_KEY': ''}):
            with self.assertRaises(ia.ErrorIA):
                ia.generar('s', [{'rol': 'usuario', 'texto': 'hola'}])

    def test_limite_por_hora(self):
        with patch('catalogo.arbitro.ia.generar', return_value='ok'):
            codigos = [
                self.c.post('/api/arbitro/', {'producto': self.catan.id, 'pregunta': 'x'}, format='json').status_code
                for _ in range(42)
            ]
        self.assertEqual(codigos.count(200), 40)
        self.assertEqual(codigos[-1], 429)

    @patch('catalogo.arbitro.ia.generar', return_value='e7e5')
    def test_jugada_ia_devuelve_una_legal(self, _):
        datos = {'juego': 'ajedrez', 'posicion': 'fen', 'legales': ['e7e5', 'd7d5']}
        r = self.c.post('/api/ia/jugada/', datos, format='json')
        self.assertEqual(r.json(), {'jugada': 'e7e5'})

    @patch('catalogo.arbitro.ia.generar', return_value='h1h8')
    def test_jugada_ia_ilegal_se_rechaza(self, _):
        datos = {'juego': 'ajedrez', 'posicion': 'fen', 'legales': ['e7e5', 'd7d5']}
        self.assertEqual(self.c.post('/api/ia/jugada/', datos, format='json').status_code, 502)


def _http(codigo, mensaje='x'):
    import io
    import urllib.error

    return urllib.error.HTTPError('u', codigo, 'e', {}, io.BytesIO(('{"error":{"message":"%s"}}' % mensaje).encode()))


RESPUESTA_OK = {'candidates': [{'content': {'parts': [{'text': 'Hola'}]}}]}


class ModelosTests(TestCase):
    def setUp(self):
        ia._modelo_que_funciona = None

    def test_prueba_el_siguiente_modelo_si_uno_da_404(self):
        with patch('catalogo.ia._enviar', side_effect=[_http(404), _http(404), RESPUESTA_OK]) as env:
            self.assertEqual(ia.generar('s', [{'rol': 'usuario', 'texto': 'h'}]), 'Hola')
        usados = [c.args[0] for c in env.call_args_list]
        self.assertEqual(usados, ia.MODELOS[:3])
        self.assertEqual(ia._modelo_que_funciona, ia.MODELOS[2])

    def test_recuerda_el_modelo_que_funciono(self):
        ia._modelo_que_funciona = 'gemini-3.5-flash'
        with patch('catalogo.ia._enviar', return_value=RESPUESTA_OK) as env:
            ia.generar('s', [{'rol': 'usuario', 'texto': 'h'}])
        self.assertEqual(env.call_args.args[0], 'gemini-3.5-flash')

    def test_si_todos_dan_404_explica_el_motivo(self):
        with patch('catalogo.ia._enviar', side_effect=lambda *a: (_ for _ in ()).throw(_http(404, 'modelo retirado'))):
            with self.assertRaises(ia.ErrorIA) as cm:
                ia.generar('s', [{'rol': 'usuario', 'texto': 'h'}])
        self.assertIn('404', str(cm.exception))
        self.assertIn('modelo retirado', str(cm.exception))

    def test_error_de_clave_muestra_el_mensaje_de_google(self):
        with patch('catalogo.ia._enviar', side_effect=_http(401, 'clave invalida')):
            with self.assertRaises(ia.ErrorIA) as cm:
                ia.generar('s', [{'rol': 'usuario', 'texto': 'h'}])
        self.assertIn('clave invalida', str(cm.exception))

    def test_limite_de_uso(self):
        with patch('catalogo.ia._enviar', side_effect=_http(429)):
            with self.assertRaises(ia.ErrorIA) as cm:
                ia.generar('s', [{'rol': 'usuario', 'texto': 'h'}])
        self.assertIn('límite', str(cm.exception))
