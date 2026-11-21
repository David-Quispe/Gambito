import { useEffect } from 'react'
import { usarRespaldo } from '@/lib/imagen'
import { MAX_POR_PRODUCTO, useCarrito } from '@/lib/carrito'

interface CarritoPanelProps {
  onCerrar: () => void
  onPagar: () => void
}

const botonCantidad =
  'flex size-7 items-center justify-center border border-ink/40 text-base font-bold hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink'

// Panel lateral con lo que el cliente va a comprar.
function CarritoPanel({ onCerrar, onPagar }: CarritoPanelProps) {
  const { items, total, cantidadTotal, cambiarCantidad, quitar, vaciar } = useCarrito()

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alPulsar)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = anterior
    }
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={onCerrar} role="dialog" aria-modal="true" aria-label="Carrito de compras">
      <aside className="flex h-full w-full max-w-md flex-col bg-paper text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-ink px-5 py-4 text-paper">
          <p className="font-display text-3xl uppercase leading-none tracking-wide">
            Tu carrito<span className="text-hot">.</span>
          </p>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="size-9 border border-paper/40 text-lg hover:bg-paper/10">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-display text-3xl uppercase">Está vacío</p>
            <p className="text-sm text-muted-foreground">Agrega juegos o accesorios desde el catálogo.</p>
            <button
              type="button"
              onClick={onCerrar}
              className="mt-2 h-10 bg-ink px-5 text-xs font-bold uppercase tracking-widest text-paper hover:bg-hot"
            >
              Seguir mirando
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/15 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    onError={(e) => usarRespaldo(e, item.nombre)}
                    className="size-20 shrink-0 bg-white object-contain"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold leading-tight">{item.nombre}</p>
                      <button
                        type="button"
                        onClick={() => quitar(item.id)}
                        className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-ink/60 underline hover:text-hot"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Quitar una unidad de ${item.nombre}`}
                          onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                          className={botonCantidad}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.cantidad}</span>
                        <button
                          type="button"
                          aria-label={`Agregar una unidad de ${item.nombre}`}
                          disabled={item.cantidad >= Math.min(item.stock, MAX_POR_PRODUCTO)}
                          onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                          className={botonCantidad}
                        >
                          +
                        </button>
                      </div>
                      <p className="font-display text-2xl leading-none">S/ {(item.precio_final * item.cantidad).toFixed(2)}</p>
                    </div>
                    {item.cantidad >= item.stock && (
                      <p className="text-[11px] text-amber-700">Es todo lo que tenemos en stock.</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-ink/20 p-5">
              <div className="flex items-end justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Total ({cantidadTotal} {cantidadTotal === 1 ? 'producto' : 'productos'})
                </p>
                <p className="font-display text-4xl leading-none">S/ {total.toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={onPagar}
                className="h-12 w-full bg-ink text-sm font-bold uppercase tracking-widest text-paper transition hover:bg-hot"
              >
                Ir a pagar
              </button>
              <button
                type="button"
                onClick={vaciar}
                className="w-full text-center text-[11px] font-semibold uppercase tracking-wider text-ink/60 underline hover:text-hot"
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

export default CarritoPanel
