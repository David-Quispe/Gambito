import { borrarToken, guardarToken, leerToken } from '@/lib/sesion'
import type { DatosCompra, Pedido } from '@/types/pedido'
import type { Filtros, Producto, ResumenInventario, Usuario } from '@/types/producto'
import type { ReporteDemanda } from '@/types/deseo'
import type { Novedad } from '@/types/novedad'

// Dirección donde corre el backend de Django
const API_URL = 'http://127.0.0.1:8000/api'

export interface Categoria {
  id: number
  nombre: string
  descripcion: string
}

// Error con el código HTTP y, si Django lo envía, el detalle por campo (registro)
export class ErrorApi extends Error {
  estado: number
  campos: Record<string, string[]>
  // Cuerpo completo de la respuesta (en un 409 trae la lista de productos sin stock)
  cuerpo: Record<string, unknown>

  constructor(
    mensaje: string,
    estado: number,
    campos: Record<string, string[]> = {},
    cuerpo: Record<string, unknown> = {},
  ) {
    super(mensaje)
    this.estado = estado
    this.campos = campos
    this.cuerpo = cuerpo
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  // Si hay sesión iniciada, se envía el token en cada petición
  const token = leerToken()
  const cabeceras = new Headers(opciones.headers)
  if (token) cabeceras.set('Authorization', `Token ${token}`)

  const respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers: cabeceras })
  if (!respuesta.ok) {
    let detalle = `El servidor respondió con el código ${respuesta.status}`
    let campos: Record<string, string[]> = {}
    let cuerpoCompleto: Record<string, unknown> = {}
    try {
      const cuerpo = await respuesta.json()
      if (cuerpo && typeof cuerpo === 'object') cuerpoCompleto = cuerpo
      if (cuerpo?.detalle) detalle = cuerpo.detalle
      else if (cuerpo?.detail) detalle = cuerpo.detail
      else if (typeof cuerpo === 'object') campos = cuerpo
    } catch {
      // la respuesta no era JSON: se queda el mensaje genérico
    }
    throw new ErrorApi(detalle, respuesta.status, campos, cuerpoCompleto)
  }
  if (respuesta.status === 204) return undefined as T
  return respuesta.json() as Promise<T>
}

// Convierte los filtros de la pantalla en parámetros de la URL (?buscar=...&oferta=1)
function armarParametros(filtros?: Partial<Filtros>): string {
  if (!filtros) return ''
  const p = new URLSearchParams()
  if (filtros.categoria && filtros.categoria !== 'Todos') p.set('categoria', filtros.categoria)
  if (filtros.tipo && filtros.tipo !== 'todos') p.set('tipo', filtros.tipo)
  if (filtros.buscar?.trim()) p.set('buscar', filtros.buscar.trim())
  if (filtros.precioMax != null) p.set('precio_max', String(filtros.precioMax))
  if (filtros.soloOfertas) p.set('oferta', '1')
  if (filtros.soloDisponibles) p.set('disponible', '1')
  if (filtros.orden) p.set('orden', filtros.orden)
  const texto = p.toString()
  return texto ? `?${texto}` : ''
}

export function obtenerProductos(filtros?: Partial<Filtros>): Promise<Producto[]> {
  return pedir<Producto[]>(`/productos/${armarParametros(filtros)}`)
}

export function obtenerCategorias(): Promise<Categoria[]> {
  return pedir<Categoria[]>('/categorias/')
}

export function obtenerRecomendados(): Promise<Producto[]> {
  return pedir<Producto[]>('/productos/recomendados/')
}

export function obtenerRecomendaciones(id: number): Promise<Producto[]> {
  return pedir<Producto[]>(`/productos/${id}/recomendaciones/`)
}

// ---------- Cuentas ----------

interface RespuestaSesion {
  token: string
  usuario: Usuario
}

const JSON_CABECERA = { 'Content-Type': 'application/json' }

export async function registrarse(username: string, email: string, password: string): Promise<Usuario> {
  const r = await pedir<RespuestaSesion>('/auth/registro/', {
    method: 'POST',
    headers: JSON_CABECERA,
    body: JSON.stringify({ username, email, password }),
  })
  guardarToken(r.token)
  return r.usuario
}

export async function iniciarSesion(identificador: string, password: string): Promise<Usuario> {
  const r = await pedir<RespuestaSesion>('/auth/login/', {
    method: 'POST',
    headers: JSON_CABECERA,
    body: JSON.stringify({ identificador, password }),
  })
  guardarToken(r.token)
  return r.usuario
}

export function obtenerUsuarioActual(): Promise<Usuario> {
  return pedir<Usuario>('/auth/yo/')
}

export async function cerrarSesion(): Promise<void> {
  try {
    await pedir<void>('/auth/logout/', { method: 'POST' })
  } finally {
    borrarToken()
  }
}

// ---------- Inventario (solo administradores) ----------

export function obtenerInventario(): Promise<ResumenInventario> {
  return pedir<ResumenInventario>('/productos/inventario/')
}

export function ajustarStock(id: number, cantidad: number): Promise<Producto> {
  return pedir<Producto>(`/productos/${id}/ajustar-stock/`, {
    method: 'POST',
    headers: JSON_CABECERA,
    body: JSON.stringify({ cantidad }),
  })
}

// ---------- Pedidos ----------

export function crearPedido(datos: DatosCompra): Promise<Pedido> {
  return pedir<Pedido>('/pedidos/', {
    method: 'POST',
    headers: JSON_CABECERA,
    body: JSON.stringify(datos),
  })
}

export function obtenerPedidos(): Promise<Pedido[]> {
  return pedir<Pedido[]>('/pedidos/')
}

// ---- Lista de deseos y reporte de demanda ----

export function obtenerDeseos(): Promise<Producto[]> {
  return pedir<Producto[]>('/deseos/')
}

export function agregarDeseo(producto: number): Promise<void> {
  return pedir<void>('/deseos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ producto }),
  })
}

export function quitarDeseo(producto: number): Promise<void> {
  return pedir<void>(`/deseos/${producto}/`, { method: 'DELETE' })
}

export function obtenerDemanda(): Promise<ReporteDemanda> {
  return pedir<ReporteDemanda>('/demanda/')
}

// ---- Novedades (torneos, juegos nuevos y sorteos) ----

export function obtenerNovedades(): Promise<Novedad[]> {
  return pedir<Novedad[]>('/novedades/')
}

export function participarEn(id: number): Promise<Novedad> {
  return pedir<Novedad>(`/novedades/${id}/participar/`, { method: 'POST' })
}

export function salirDe(id: number): Promise<Novedad> {
  return pedir<Novedad>(`/novedades/${id}/participar/`, { method: 'DELETE' })
}

// ---- Árbitro IA y jugadas de la IA ----

export interface MensajeArbitro {
  rol: 'usuario' | 'ia'
  texto: string
}

export function preguntarArbitro(producto: number, pregunta: string, historial: MensajeArbitro[]): Promise<{ respuesta: string }> {
  return pedir<{ respuesta: string }>('/arbitro/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ producto, pregunta, historial }),
  })
}

export function pedirJugadaIA(posicion: string, legales: string[], historial: string): Promise<{ jugada: string }> {
  return pedir<{ jugada: string }>('/ia/jugada/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ juego: 'ajedrez', posicion, legales, historial }),
  })
}
