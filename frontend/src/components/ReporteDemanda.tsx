import { useEffect, useState } from 'react'
import { obtenerDemanda } from '@/services/api'
import type { ReporteDemanda as Reporte } from '@/types/deseo'

// Ranking de demanda para el administrador: favoritos + unidades vendidas, con aviso de reposición.
function ReporteDemanda() {
  const [datos, setDatos] = useState<Reporte | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    obtenerDemanda()
      .then((r) => {
        if (!cancelado) setDatos(r)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo cargar el reporte de demanda')
      })
    return () => {
      cancelado = true
    }
  }, [])

  if (error) return <p role="alert" className="border border-hot bg-hot/10 px-4 py-2 text-sm">{error}</p>
  if (!datos) return <p className="text-sm text-muted-foreground">Cargando reporte de demanda...</p>

  const maximo = Math.max(1, ...datos.productos.map((f) => f.deseos + f.ventas))

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.25em]">Demanda de productos</h3>
        <p className="text-xs text-muted-foreground">{datos.total_deseos} favoritos guardados en total</p>
      </div>
      {datos.productos.length === 0 ? (
        <p className="border border-ink/20 bg-card p-4 text-sm">Todavía no hay favoritos ni ventas para analizar.</p>
      ) : (
        <div className="overflow-x-auto border border-ink/25">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-ink text-[11px] uppercase tracking-widest text-paper">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Favoritos</th>
                <th className="px-3 py-2">Vendidos</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Demanda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {datos.productos.map((f) => (
                <tr key={f.id} className={f.reponer ? 'bg-hot/10' : ''}>
                  <td className="px-3 py-2">
                    <span className="font-bold">{f.nombre}</span>
                    <span className="block text-[11px] text-muted-foreground">{f.categoria}</span>
                  </td>
                  <td className="px-3 py-2">{f.deseos}</td>
                  <td className="px-3 py-2">{f.ventas}</td>
                  <td className="px-3 py-2">
                    {f.stock}
                    {f.reponer && <span className="ml-2 bg-hot px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Reponer</span>}
                  </td>
                  <td className="w-40 px-3 py-2">
                    <div className="h-2 bg-ink/10">
                      <div className="h-2 bg-ink" style={{ width: `${((f.deseos + f.ventas) / maximo) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ReporteDemanda
