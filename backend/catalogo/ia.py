"""Conexión con la IA (Gemini). Todo lo que habla con el proveedor está en este archivo:
para cambiar a otro modelo o proveedor solo se modifica `generar`.

La clave se lee de la variable de entorno GEMINI_API_KEY (backend/.env). Nunca llega al navegador.
"""
import json
import os
import urllib.error
import urllib.request

# Modelos que se prueban en orden. Google retira modelos con el tiempo (un modelo retirado responde 404),
# así que se empieza por el alias "flash-latest" y se sigue con otros. Se puede fijar uno con GEMINI_MODEL en .env.
URL = 'https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent'
MODELOS = [m for m in [os.environ.get('GEMINI_MODEL', '').strip(), 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'] if m]
_modelo_que_funciona = None  # se recuerda el último modelo que respondió bien


class ErrorIA(Exception):
    """La IA no pudo responder (sin clave, sin internet, límite de uso, etc.). El mensaje es apto para mostrar."""


def _mensaje_de_google(e):
    """Texto de error que devuelve Google (corto), para mostrarlo y poder diagnosticar."""
    try:
        return str(json.load(e)['error']['message'])[:160]
    except Exception:  # noqa: BLE001 - el cuerpo puede no ser JSON
        return ''


def _enviar(modelo, cuerpo, clave):
    peticion = urllib.request.Request(
        URL.format(modelo=modelo),
        data=json.dumps(cuerpo).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'x-goog-api-key': clave},
        method='POST',
    )
    with urllib.request.urlopen(peticion, timeout=25) as r:
        return json.load(r)


def generar(sistema, mensajes, temperatura=0.4, max_tokens=700):
    """mensajes: lista de {'rol': 'usuario'|'ia', 'texto': str}. Devuelve el texto de la respuesta."""
    global _modelo_que_funciona
    clave = os.environ.get('GEMINI_API_KEY', '').strip()
    if not clave:
        raise ErrorIA('La IA todavía no está configurada: falta GEMINI_API_KEY en backend/.env.')

    cuerpo = {
        'systemInstruction': {'parts': [{'text': sistema}]},
        'contents': [
            {'role': 'user' if m['rol'] == 'usuario' else 'model', 'parts': [{'text': m['texto']}]} for m in mensajes
        ],
        'generationConfig': {'temperature': temperatura, 'maxOutputTokens': max_tokens},
    }
    candidatos = ([_modelo_que_funciona] if _modelo_que_funciona else []) + [m for m in MODELOS if m != _modelo_que_funciona]
    datos = None
    ultimo_404 = ''
    try:
        for modelo in candidatos:
            try:
                datos = _enviar(modelo, cuerpo, clave)
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    ultimo_404 = f'{modelo}: {_mensaje_de_google(e)}'
                    continue  # modelo retirado o no disponible para esta clave: se prueba el siguiente
                raise
            _modelo_que_funciona = modelo
            break
    except urllib.error.HTTPError as e:
        detalle = _mensaje_de_google(e)
        if e.code in (401, 403):
            raise ErrorIA(f'Google no aceptó la clave de la IA ({e.code}). {detalle}'.strip()) from e
        if e.code == 429:
            raise ErrorIA('Se alcanzó el límite gratuito de la IA. Prueba de nuevo en un minuto.') from e
        raise ErrorIA(f'La IA respondió con un error ({e.code}). {detalle}'.strip()) from e
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErrorIA('No se pudo conectar con la IA. Revisa tu conexión a internet.') from e
    if datos is None:
        raise ErrorIA(f'Ningún modelo de Gemini estuvo disponible para esta clave (404). {ultimo_404}'.strip())

    try:
        partes = datos['candidates'][0]['content']['parts']
        texto = ''.join(p.get('text', '') for p in partes).strip()
    except (KeyError, IndexError, TypeError) as e:
        raise ErrorIA('La IA no devolvió una respuesta (puede que haya bloqueado la pregunta).') from e
    if not texto:
        raise ErrorIA('La IA devolvió una respuesta vacía.')
    return texto
