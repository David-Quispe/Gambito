export type MetodoPago = 'tarjeta' | 'yape' | 'contraentrega'

export interface ItemPedido {
  producto: number | null
  nombre: string
  precio_unitario: number
  cantidad: number
  subtotal: number
}

export interface Pedido {
  id: number
  creado: string
  estado: 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado'
  estado_nombre: string
  metodo_pago: MetodoPago
  metodo_nombre: string
  referencia_pago: string
  nombre_cliente: string
  direccion: string
  total: number
  items: ItemPedido[]
}

// Lo que se envía a Django al pagar. Del pago solo viajan los 4 últimos dígitos.
export interface DatosCompra {
  items: { producto: number; cantidad: number }[]
  nombre: string
  direccion: string
  metodo: MetodoPago
  tarjeta_final?: string
}

export interface Faltante {
  producto: number
  nombre: string
  disponible: number
}
