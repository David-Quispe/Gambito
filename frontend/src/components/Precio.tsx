import type { Producto } from '@/types/producto'

interface PrecioProps {
  producto: Pick<Producto, 'precio' | 'precio_final' | 'descuento' | 'en_oferta'>
  color?: string
  className?: string
}

// Muestra el precio final y, si hay promoción, el precio anterior tachado.
function Precio({ producto, color, className = '' }: PrecioProps) {
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="font-display text-3xl leading-none" style={{ color }}>
        S/ {producto.precio_final.toFixed(2)}
      </span>
      {producto.en_oferta && (
        <span className="text-sm line-through opacity-60">S/ {producto.precio.toFixed(2)}</span>
      )}
    </span>
  )
}

export default Precio
