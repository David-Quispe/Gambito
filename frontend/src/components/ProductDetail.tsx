import { useEffect, useState } from 'react'
import ArbitroIA from '@/components/ArbitroIA'
import BotonAgregar from '@/components/BotonAgregar'
import BotonDeseo from '@/components/BotonDeseo'
import InfoJuego from '@/components/InfoJuego'
import JugarContraBot from '@/components/JugarContraBot'
import MiniProducto from '@/components/MiniProducto'
import Precio from '@/components/Precio'
import StatBadge from '@/components/StatBadge'
import { obtenerRecomendaciones } from '@/services/api'
import { usarRespaldo } from '@/lib/imagen'
import { obtenerTema } from '@/lib/temas'
import type { Producto } from '@/types/producto'

interface ProductDetailProps {
  producto: Producto
  onCerrar: () => void
  onVer: (producto: Producto) => void
}

// Ventana con el detalle del juego y, abajo, los juegos que se le parecen.
function ProductDetail({ producto, onCerrar, onVer }: ProductDetailProps) {
  const tema = obtenerTema(producto.categoria)
  const [similares, setSimilares] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)

  // Pide al backend las recomendaciones. App usa key={producto.id}, así que al abrir
  // otro juego el componente se crea de nuevo y empieza en "cargando".
  useEffect(() => {
    let cancelado = false
    obtenerRecomendaciones(producto.id)
      .then((lista) => {
        if (!cancelado) setSimilares(lista)
      })
      .catch(() => {
        if (!cancelado) setSimilares([])
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [producto.id])

  // Cierra con la tecla Escape y evita que la página de fondo se mueva
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

  const sinStock = producto.stock === 0

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${producto.nombre}`}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-paper text-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative text-white" style={{ background: tema.fondo }}>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center bg-black/50 text-lg hover:bg-black/70"
          >
            ✕
          </button>

          <div className="grid gap-4 p-6 sm:grid-cols-[1fr_1.2fr]">
            <div className="relative flex h-52 items-center justify-center sm:h-64">
              <img
                key={producto.id}
                src={producto.imagen}
                alt={`Portada de ${producto.nombre}`}
                onError={(e) => usarRespaldo(e, producto.nombre)}
                className={`max-h-full max-w-full object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)] ${
                  sinStock ? 'grayscale' : ''
                }`}
              />
              {producto.en_oferta && !sinStock && (
                <span className="absolute left-0 top-0 rotate-[-4deg] bg-hot px-3 py-1 font-display text-xl tracking-wider shadow-lg">
                  -{producto.descuento}%
                </span>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
                {producto.categoria}
              </p>
              <h3
                className="font-serif text-4xl font-bold uppercase leading-none"
                style={{ color: tema.titulo }}
              >
                {producto.nombre}
              </h3>
              <p className="text-sm leading-relaxed text-white/85">{producto.descripcion}</p>
              <div className="flex gap-5">
                <StatBadge tipo="jugadores" valor={producto.jugadores} fondo={tema.acento} color={tema.acentoTexto} />
                <StatBadge tipo="duracion" valor={producto.duracion} fondo={tema.acento} color={tema.acentoTexto} />
                <StatBadge tipo="edad" valor={producto.edad} fondo={tema.acento} color={tema.acentoTexto} />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Precio producto={producto} color={tema.titulo} />
                <span
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    sinStock
                      ? 'bg-red-600 text-white'
                      : producto.stock_bajo
                        ? 'bg-amber-400 text-ink'
                        : 'bg-white/15 text-white'
                  }`}
                >
                  {sinStock
                    ? 'Agotado'
                    : producto.stock_bajo
                      ? `¡Últimas ${producto.stock} unidades!`
                      : `${producto.stock} disponibles`}
                </span>
                <BotonDeseo id={producto.id} nombre={producto.nombre} className="border-current" />
                <BotonAgregar
                  producto={producto}
                  className="h-10 px-6"
                  style={{ background: tema.acento, color: tema.acentoTexto }}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <JugarContraBot nombre={producto.nombre} style={{ color: tema.titulo }} />
                {producto.tipo === 'juego' && <ArbitroIA idProducto={producto.id} nombre={producto.nombre} style={{ color: tema.titulo }} />}
              </div>
            </div>
          </div>
        </div>

        <InfoJuego producto={producto} />

        <div className="space-y-4 p-6">
          <h4 className="text-sm font-bold uppercase tracking-[0.25em]">
            <span className="mr-2 text-hot">▸</span>Si te gusta {producto.nombre}, prueba con
          </h4>

          {cargando && <p className="text-sm text-muted-foreground">Buscando recomendaciones...</p>}
          {!cargando && similares.length === 0 && (
            <p className="text-sm text-muted-foreground">Por ahora no hay recomendaciones para este juego.</p>
          )}
          {!cargando && similares.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {similares.map((juego) => (
                <MiniProducto key={juego.id} producto={juego} onVer={onVer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
