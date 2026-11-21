import { useEffect, useState } from 'react'
import SectionTitle from '@/components/SectionTitle'
import { obtenerPedidos } from '@/services/api'
import type { Pedido } from '@/types/pedido'

const colorEstado: Record<Pedido['estado'], string> = {
  pendiente: 'bg-amber-400 text-ink',
  pagado: 'bg-emerald-600 text-white',
  enviado: 'bg-sky-600 text-white',
  entregado: 'bg-ink text-paper',
  cancelado: 'bg-red-600 text-white',
}

interface MisPedidosProps {
  onVolver: () => void
}

// Historial de compras de la persona que tiene la sesión iniciada.
function MisPedidos({ onVolver }: MisPedidosProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    obtenerPedidos()
      .then((lista) => {
        if (!cancelado) setPedidos(lista)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudieron cargar tus pedidos')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <SectionTitle numero="00" titulo="Mis pedidos" derecha={cargando ? '' : `${pedidos.length} pedidos`} />

      {cargando && <p className="text-sm text-muted-foreground">Cargando tus pedidos...</p>}
      {error && (
        <p role="alert" className="border border-hot bg-hot/10 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {!cargando && !error && pedidos.length === 0 && (
        <div className="space-y-3 border border-ink/20 bg-card p-8 text-center">
          <p className="font-display text-3xl uppercase">Aún no compras nada</p>
          <button type="button" onClick={onVolver} className="h-10 bg-ink px-5 text-xs font-bold uppercase tracking-widest text-paper hover:bg-hot">
            Ir al catálogo
          </button>
        </div>
      )}

      <ul className="space-y-4">
        {pedidos.map((p) => (
          <li key={p.id} className="border border-ink/25 bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 px-4 py-3">
              <p className="font-display text-2xl leading-none">
                Pedido #{p.id}
                <span className="ml-3 text-xs font-sans font-normal text-muted-foreground">
                  {new Date(p.creado).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </p>
              <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${colorEstado[p.estado]}`}>{p.estado_nombre}</span>
            </div>
            <ul className="divide-y divide-ink/10 px-4 text-sm">
              {p.items.map((item) => (
                <li key={`${p.id}-${item.nombre}`} className="flex justify-between gap-3 py-2">
                  <span>
                    {item.cantidad} × {item.nombre}
                  </span>
                  <span>S/ {item.subtotal.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-end justify-between gap-2 border-t border-ink/15 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {p.metodo_nombre} · {p.referencia_pago}
                <br />
                Entrega: {p.direccion}
              </p>
              <p className="font-display text-3xl leading-none">S/ {p.total.toFixed(2)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MisPedidos
