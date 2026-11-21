import type { Producto } from '@/types/producto'

interface PromoBannerProps {
  productos: Producto[]
  onVerOfertas: () => void
}

// Franja de marketing: resume las promociones vigentes y lleva al catálogo filtrado.
function PromoBanner({ productos, onVerOfertas }: PromoBannerProps) {
  const ofertas = productos.filter((p) => p.en_oferta)
  if (ofertas.length === 0) return null

  const mayor = ofertas.reduce((a, b) => (b.descuento > a.descuento ? b : a))

  return (
    <section className="bg-hot text-white" aria-label="Promociones">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm sm:text-base">
          <span className="mr-2 font-display text-2xl uppercase tracking-wide">
            Hasta {mayor.descuento}% de descuento
          </span>
          en {ofertas.length} juegos, como {mayor.nombre}. Hasta agotar stock.
        </p>
        <button
          type="button"
          onClick={onVerOfertas}
          className="shrink-0 bg-ink px-5 py-2 text-xs font-bold uppercase tracking-widest text-paper transition hover:bg-ink/80"
        >
          Ver ofertas ▶
        </button>
      </div>
    </section>
  )
}

export default PromoBanner
