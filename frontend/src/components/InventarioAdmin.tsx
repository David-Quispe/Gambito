import { useCallback, useEffect, useState } from 'react'
import ReporteDemanda from '@/components/ReporteDemanda'
import SectionTitle from '@/components/SectionTitle'
import { ajustarStock, obtenerInventario, obtenerProductos } from '@/services/api'
import type { Producto, ResumenInventario } from '@/types/producto'

function Tarjeta({ titulo, valor, alerta }: { titulo: string; valor: string | number; alerta?: boolean }) {
  return (
    <div className={`border p-4 ${alerta ? 'border-hot bg-hot/10' : 'border-ink/30 bg-card'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{titulo}</p>
      <p className="font-display text-3xl leading-tight">{valor}</p>
    </div>
  )
}

interface InventarioAdminProps {
  onVolver: () => void
}

// Gestión de inventario. Solo se muestra a administradores y el backend
// vuelve a comprobar el permiso en cada cambio.
function InventarioAdmin({ onVolver }: InventarioAdminProps) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [resumen, setResumen] = useState<ResumenInventario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const recargar = useCallback(() => setVersion((n) => n + 1), [])

  useEffect(() => {
    let cancelado = false
    Promise.all([obtenerProductos(), obtenerInventario()])
      .then(([lista, inventario]) => {
        if (cancelado) return
        setProductos(lista)
        setResumen(inventario)
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo cargar el inventario')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [version])

  async function cambiar(producto: Producto, cantidad: number) {
    setOcupado(producto.id)
    setError(null)
    try {
      await ajustarStock(producto.id, cantidad)
      recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el stock')
    } finally {
      setOcupado(null)
    }
  }

  // Primero lo que necesita reponerse: agotados y luego stock bajo
  const ordenados = [...productos].sort((a, b) => a.stock - b.stock || a.nombre.localeCompare(b.nombre))
  const umbral = resumen?.umbral_stock_bajo ?? 3

  return (
    <section id="inventario" className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <SectionTitle numero="AD" titulo="Inventario" derecha="Panel del administrador" />

      <button
        type="button"
        onClick={onVolver}
        className="text-xs font-bold uppercase tracking-widest underline-offset-4 hover:underline"
      >
        ◀ Volver a la tienda
      </button>

      <ReporteDemanda />

      {cargando && <p className="py-10 text-center text-muted-foreground">Cargando inventario...</p>}

      {resumen && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Tarjeta titulo="Juegos" valor={resumen.total_productos} />
          <Tarjeta titulo="Unidades" valor={resumen.unidades} />
          <Tarjeta titulo="Agotados" valor={resumen.agotados} alerta={resumen.agotados > 0} />
          <Tarjeta titulo={`Stock bajo (≤${umbral})`} valor={resumen.stock_bajo} alerta={resumen.stock_bajo > 0} />
          <Tarjeta
            titulo="Valor en tienda"
            valor={`S/ ${resumen.valor_inventario.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="border border-hot bg-hot/10 px-4 py-2 text-sm">
          {error}
        </p>
      )}

      {!cargando && productos.length > 0 && (
        <div className="overflow-x-auto border border-ink/30 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-ink text-left text-[11px] uppercase tracking-widest text-paper">
              <tr>
                <th className="px-3 py-3 sm:px-4">Juego</th>
                <th className="hidden px-4 py-3 sm:table-cell">Categoría</th>
                <th className="hidden px-4 py-3 sm:table-cell">Estado</th>
                <th className="px-3 py-3 text-right sm:px-4">Stock</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((p) => {
                const estado =
                  p.stock === 0
                    ? { texto: 'Agotado', clase: 'bg-red-600 text-white' }
                    : p.stock_bajo
                      ? { texto: 'Stock bajo', clase: 'bg-amber-400 text-ink' }
                      : { texto: 'Disponible', clase: 'bg-emerald-600 text-white' }
                return (
                  <tr key={p.id} className="border-t border-ink/15">
                    <td className="px-3 py-2 font-semibold sm:px-4">
                      {p.nombre}
                      <span
                        className={`mt-1 block w-fit px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:hidden ${estado.clase}`}
                      >
                        {estado.texto}
                      </span>
                    </td>
                    <td className="hidden px-4 py-2 text-muted-foreground sm:table-cell">{p.categoria}</td>
                    <td className="hidden px-4 py-2 sm:table-cell">
                      <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${estado.clase}`}>
                        {estado.texto}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-4">
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          disabled={ocupado === p.id || p.stock === 0}
                          onClick={() => cambiar(p, -1)}
                          aria-label={`Quitar una unidad de ${p.nombre}`}
                          className="size-8 border border-ink font-bold transition hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-display text-xl">{p.stock}</span>
                        <button
                          type="button"
                          disabled={ocupado === p.id}
                          onClick={() => cambiar(p, 1)}
                          aria-label={`Agregar una unidad de ${p.nombre}`}
                          className="size-8 border border-ink font-bold transition hover:bg-ink hover:text-paper disabled:opacity-30"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          disabled={ocupado === p.id}
                          onClick={() => cambiar(p, 10)}
                          className="hidden h-8 border border-ink px-2 text-xs font-bold transition hover:bg-ink hover:text-paper sm:block"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default InventarioAdmin
