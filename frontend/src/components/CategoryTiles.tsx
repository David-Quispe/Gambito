import { usarRespaldo } from '@/lib/imagen'
import SectionTitle from '@/components/SectionTitle'
import { obtenerTema } from '@/lib/temas'
import type { Producto } from '@/types/producto'

interface CategoryTilesProps {
  categorias: string[]
  productos: Producto[]
  onSeleccionar: (categoria: string) => void
}

function CategoryTiles({ categorias, productos, onSeleccionar }: CategoryTilesProps) {
  return (
    <section id="categorias" className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <SectionTitle numero="02" titulo="Categorías" derecha="Elige cómo quieres jugar" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categorias.map((categoria, i) => {
          const delCategoria = productos.filter((p) => p.categoria === categoria)
          const portada = delCategoria[0]
          const tema = obtenerTema(categoria)

          return (
            <button
              key={categoria}
              type="button"
              onClick={() => {
                onSeleccionar(categoria)
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="group relative aspect-[3/4] overflow-hidden text-left"
              style={{ background: tema.fondo }}
            >
              {portada && (
                <img
                  src={portada.imagen}
                  onError={(e) => usarRespaldo(e, portada.nombre)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              <span className="absolute left-3 top-3 bg-hot px-2 py-0.5 font-display text-sm text-ink">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="absolute inset-x-3 bottom-3 text-white">
                <p className="font-display text-xl uppercase leading-none tracking-wide">
                  {categoria}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-white/70">
                  {delCategoria.length} productos
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default CategoryTiles
