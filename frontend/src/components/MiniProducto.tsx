import { usarRespaldo } from '@/lib/imagen'
import { obtenerTema } from '@/lib/temas'
import type { Producto } from '@/types/producto'

interface MiniProductoProps {
  producto: Producto
  onVer: (producto: Producto) => void
}

// Tarjeta pequeña que se usa en las recomendaciones.
function MiniProducto({ producto, onVer }: MiniProductoProps) {
  const tema = obtenerTema(producto.categoria)

  return (
    <button
      type="button"
      onClick={() => onVer(producto)}
      className="group relative flex flex-col text-left text-white transition hover:-translate-y-1"
      style={{ background: tema.fondo }}
    >
      {producto.en_oferta && (
        <span className="absolute right-2 top-2 z-10 bg-hot px-2 py-0.5 font-display text-sm tracking-wider">
          -{producto.descuento}%
        </span>
      )}
      <div className="flex h-32 items-center justify-center p-3">
        <img
          src={producto.imagen}
          alt={`Portada de ${producto.nombre}`}
          loading="lazy"
          onError={(e) => usarRespaldo(e, producto.nombre)}
          className="max-h-full max-w-full object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.5)] transition group-hover:scale-105"
        />
      </div>
      <div className="space-y-0.5 border-t border-white/15 bg-black/25 px-3 py-2">
        <p className="truncate text-xs font-bold uppercase tracking-wider">{producto.nombre}</p>
        <p className="text-sm">
          <span className="font-display text-lg" style={{ color: tema.titulo }}>
            S/ {producto.precio_final.toFixed(2)}
          </span>
          {producto.en_oferta && (
            <span className="ml-1.5 text-xs line-through opacity-60">
              {producto.precio.toFixed(2)}
            </span>
          )}
        </p>
      </div>
    </button>
  )
}

export default MiniProducto
