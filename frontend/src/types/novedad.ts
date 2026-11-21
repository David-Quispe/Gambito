export type TipoNovedad = 'torneo' | 'nuevo' | 'sorteo'

export interface Novedad {
  id: number
  tipo: TipoNovedad
  tipo_nombre: string
  titulo: string
  resumen: string
  detalle: string
  fecha: string | null
  lugar: string
  cupos: number | null
  cupos_restantes: number | null
  producto: number | null
  producto_nombre: string | null
  producto_imagen: string | null
  participantes: number
  participo: boolean
  cerrada: boolean
  ganador_nombre: string | null
}
