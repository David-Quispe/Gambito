export interface FilaDemanda {
  id: number
  nombre: string
  categoria: string
  deseos: number
  ventas: number
  stock: number
  reponer: boolean
}

export interface ReporteDemanda {
  total_deseos: number
  productos: FilaDemanda[]
}
