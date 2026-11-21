import { createContext, useContext } from 'react'
import type { Faltante } from '@/types/pedido'
import type { Producto } from '@/types/producto'

// Tope por producto (el backend también lo exige)
export const MAX_POR_PRODUCTO = 20

// Del producto solo se guarda lo necesario para dibujar el carrito
export interface ItemCarrito {
  id: number
  nombre: string
  imagen: string
  precio_final: number
  stock: number
  cantidad: number
}

export interface EstadoCarrito {
  items: ItemCarrito[]
  cantidadTotal: number
  total: number
  agregar: (producto: Producto) => boolean
  cambiarCantidad: (id: number, cantidad: number) => void
  quitar: (id: number) => void
  vaciar: () => void
  // Pone al día precios y stock con lo que dice el servidor, y quita lo que ya no se vende
  sincronizar: (productos: Producto[]) => void
  // Después de un error de stock: baja las cantidades a lo que realmente hay
  ajustarAStock: (faltantes: Faltante[]) => void
}

export const CarritoContext = createContext<EstadoCarrito | null>(null)

export function useCarrito(): EstadoCarrito {
  const contexto = useContext(CarritoContext)
  if (!contexto) throw new Error('useCarrito se usa dentro de <CarritoProvider>')
  return contexto
}

const CLAVE = 'gambito_carrito'

const esItem = (x: unknown): x is ItemCarrito =>
  typeof x === 'object' &&
  x !== null &&
  typeof (x as ItemCarrito).id === 'number' &&
  typeof (x as ItemCarrito).cantidad === 'number' &&
  typeof (x as ItemCarrito).precio_final === 'number'

export function leerCarrito(): ItemCarrito[] {
  try {
    const texto = localStorage.getItem(CLAVE)
    const datos: unknown = texto ? JSON.parse(texto) : []
    return Array.isArray(datos) ? datos.filter(esItem) : []
  } catch {
    return []
  }
}

export function guardarCarrito(items: ItemCarrito[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items))
  } catch {
    // si el navegador no deja guardar, el carrito dura hasta recargar
  }
}
