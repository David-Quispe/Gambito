import type { Producto } from '@/types/producto'

// Dirección donde corre el backend de Django
const API_URL = 'http://127.0.0.1:8000/api'

export interface Categoria {
  id: number
  nombre: string
  descripcion: string
}

async function pedir<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`)
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió con el código ${respuesta.status}`)
  }
  return respuesta.json() as Promise<T>
}

export function obtenerProductos(categoria?: string): Promise<Producto[]> {
  const filtro = categoria ? `?categoria=${encodeURIComponent(categoria)}` : ''
  return pedir<Producto[]>(`/productos/${filtro}`)
}

export function obtenerCategorias(): Promise<Categoria[]> {
  return pedir<Categoria[]>('/categorias/')
}
