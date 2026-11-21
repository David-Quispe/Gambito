"""Conexión con la IA (Gemini). Todo lo que habla con el proveedor está en este archivo:
para cambiar a otro modelo o proveedor solo se modifica `generar`.

La clave se lee de la variable de entorno GEMINI_API_KEY (backend/.env). Nunca llega al navegador.
"""
import json
import os
import urllib.error
import urllib.request

MODELO = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')
URL = 'https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent'


class ErrorIA(Exception):
    """La IA no pudo responder (sin clave, sin internet, límite de uso, etc.). El mensaje es apto para mostrar."""


def generar(sistema, mensajes, temperatura=0.4, max_tokens=700):
    """mensajes: lista de {'rol': 'usuario'|'ia', 'texto': str}. Devuelve el texto de la respuesta."""
    clave = os.environ.get('GEMINI_API_KEY', '').strip()
    if not clave:
        raise ErrorIA('La IA todavía no está configurada: falta GEMINI_API_KEY en backend/.env.')

    cuerpo = {
        'systemInstruction': {'parts': [{'text': sistema}]},
        'contents': [
            {'role': 'user' if m['rol'] == 'usuario' else 'model', 'parts': [{'text': m['texto']}]} for m in mensajes
        ],
        'generationConfig': {
            'temperature': temperatura,
            'maxOutputTokens': max_tokens,
            # respuestas directas: sin gastar la cuota en razonar largo
            'thinkingConfig': {'thinkingBudget': 0},
        },
    }
    peticion = urllib.request.Request(
        URL.format(modelo=MODELO),
        data=json.dumps(cuerpo).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'x-goog-api-key': clave},
        method='POST',
    )
    try:
        with urllib.request.urlopen(peticion, timeout=25) as r:
            datos = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code in (400, 401, 403):
            raise ErrorIA('La clave de la IA no fue aceptada. Revisa GEMINI_API_KEY en backend/.env.') from e
        if e.code == 429:
            raise ErrorIA('Se alcanzó el límite gratuito de la IA. Prueba de nuevo en un minuto.') from e
        raise ErrorIA(f'La IA respondió con un error ({e.code}).') from e
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErrorIA('No se pudo conectar con la IA. Revisa tu conexión a internet.') from e

    try:
        partes = datos['candidates'][0]['content']['parts']
        texto = ''.join(p.get('text', '') for p in partes).strip()
    except (KeyError, IndexError, TypeError) as e:
        raise ErrorIA('La IA no devolvió una respuesta (puede que haya bloqueado la pregunta).') from e
    if not texto:
        raise ErrorIA('La IA devolvió una respuesta vacía.')
    return texto
