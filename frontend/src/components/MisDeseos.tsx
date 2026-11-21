import { useEffect, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import SectionTitle from '@/components/SectionTitle'
import { useDeseos } from '@/lib/deseos'
import { obtenerDeseos } from '@/services/api'
import type { Producto } from '@/types/producto'

interface MisDeseosProps {
  onVer: (producto: Producto) => void
  onVolver: () => void
}

// Productos que la persona guardó con el corazón.
function MisDeseos({ onVer, onVolver }: MisDeseosProps) {
  const { ids } = useDeseos()
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    obtenerDeseos()
      .then((lista) => {
        if (!cancelado) setProductos(lista)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudieron cargar tus favoritos')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  // Si se quita un corazón desde esta pantalla, la tarjeta desaparece sin recargar
  const visibles = productos.filter((p) => ids.has(p.id))

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <SectionTitle numero="00" titulo="Mis favoritos" derecha={cargando ? '' : `${visibles.length} productos`} />
      {cargando && <p className="text-sm text-muted-foreground">Cargando tus favoritos...</p>}
      {error && (
        <p role="alert" className="border border-hot bg-hot/10 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {!cargando && !error && visibles.length === 0 && (
        <div className="space-y-3 border border-ink/20 bg-card p-8 text-center">
          <p className="font-display text-3xl uppercase">Aún no guardas favoritos</p>
          <p className="text-sm text-muted-foreground">Toca el corazón de cualquier juego o accesorio para verlo aquí.</p>
          <button type="button" onClick={onVolver} className="h-10 bg-ink px-5 text-xs font-bold uppercase tracking-widest text-paper hover:bg-hot">
            Ir al catálogo
          </button>
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <ProductCard key={p.id} producto={p} onVer={onVer} />
        ))}
      </div>
    </section>
  )
}

export default MisDeseos
