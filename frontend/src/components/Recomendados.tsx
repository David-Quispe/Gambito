import MiniProducto from '@/components/MiniProducto'
import SectionTitle from '@/components/SectionTitle'
import type { Producto } from '@/types/producto'

interface RecomendadosProps {
  productos: Producto[]
  onVer: (producto: Producto) => void
}

// Sección del inicio: los juegos más vendidos que todavía tienen stock.
function Recomendados({ productos, onVer }: RecomendadosProps) {
  if (productos.length === 0) return null

  return (
    <section id="recomendados" className="mx-auto max-w-6xl space-y-6 px-4 pb-16">
      <SectionTitle numero="04" titulo="Recomendados para ti" derecha="Los favoritos de la tienda" />
      <p className="max-w-xl text-sm text-muted-foreground">
        Son los juegos que más se están llevando. Abre cualquiera y te mostramos otros parecidos.
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {productos.map((producto) => (
          <MiniProducto key={producto.id} producto={producto} onVer={onVer} />
        ))}
      </div>
    </section>
  )
}

export default Recomendados
