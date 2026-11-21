// La sesión se guarda en el navegador para que no se pierda al recargar la página.
const CLAVE = 'gambito_token'

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function guardarToken(token: string) {
  try {
    localStorage.setItem(CLAVE, token)
  } catch {
    // si el navegador no deja guardar, la sesión dura hasta recargar
  }
}

export function borrarToken() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
}
