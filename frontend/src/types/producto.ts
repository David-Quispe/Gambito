export interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  descuento: number
  precio_final: number
  en_oferta: boolean
  imagen: string
  categoria: string
  stock: number
  stock_bajo: boolean
  ventas: number
  jugadores: string
  duracion: string
  edad: string
  tipo: string
  tipo_nombre: string
}

export type Orden = '' | 'populares' | 'precio_asc' | 'precio_desc' | 'descuento' | 'nombre'

// Lo que el visitante puede pedir al catálogo (se envía a Django como parámetros)
export interface Filtros {
  categoria: string
  tipo: string
  buscar: string
  precioMax: number | null
  soloOfertas: boolean
  soloDisponibles: boolean
  orden: Orden
}

export interface Usuario {
  id: number
  username: string
  email: string
  es_admin: boolean
}

export interface ResumenInventario {
  total_productos: number
  unidades: number
  agotados: number
  stock_bajo: number
  en_oferta: number
  valor_inventario: number
  umbral_stock_bajo: number
}
