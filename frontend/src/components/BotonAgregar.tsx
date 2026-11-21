import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useCarrito } from '@/lib/carrito'
import type { Producto } from '@/types/producto'

interface BotonAgregarProps {
  producto: Producto
  className?: string
  style?: CSSProperties
}

// Botón "Agregar" con un aviso breve de que se agregó (o de que ya no hay más unidades).
function BotonAgregar({ producto, className = '', style }: BotonAgregarProps) {
  const { agregar } = useCarrito()
  const [aviso, setAviso] = useState<string | null>(null)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  if (producto.stock === 0) return null

  function alPulsar() {
    setAviso(agregar(producto) ? '✓ Agregado' : 'Máximo en tu carrito')
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setAviso(null), 1400)
  }

  return (
    <button
      type="button"
      onClick={alPulsar}
      style={style}
      className={`h-9 rounded-full px-4 text-xs font-bold uppercase tracking-widest transition ${className}`}
    >
      {aviso ?? 'Agregar'}
    </button>
  )
}

export default BotonAgregar
