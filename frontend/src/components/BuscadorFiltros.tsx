import { useState } from 'react'
import { TIPOS } from '@/lib/tipos'
import type { Filtros, Orden } from '@/types/producto'

interface BuscadorFiltrosProps {
  filtros: Filtros
  precioTope: number
  onCambiar: (cambios: Partial<Filtros>) => void
  onLimpiar: () => void
}

const opcionesOrden: { valor: Orden; texto: string }[] = [
  { valor: '', texto: 'Orden de la tienda' },
  { valor: 'populares', texto: 'Más vendidos' },
  { valor: 'precio_asc', texto: 'Precio: menor a mayor' },
  { valor: 'precio_desc', texto: 'Precio: mayor a menor' },
  { valor: 'descuento', texto: 'Mayor descuento' },
  { valor: 'nombre', texto: 'Nombre (A-Z)' },
]

function BuscadorFiltros({ filtros, precioTope, onCambiar, onLimpiar }: BuscadorFiltrosProps) {
  // En celular los filtros se pliegan para no ocupar toda la pantalla
  const [abierto, setAbierto] = useState(false)
  const precioMax = filtros.precioMax ?? precioTope

  const hayFiltros =
    filtros.tipo !== 'todos' ||
    filtros.buscar !== '' ||
    filtros.precioMax !== null ||
    filtros.soloOfertas ||
    filtros.soloDisponibles ||
    filtros.orden !== ''

  const campo =
    'h-10 w-full border border-ink bg-transparent px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-hot'

  return (
    <div className="space-y-3 border border-ink/30 bg-card p-4">
      <div className="flex gap-2">
        <input
          type="search"
          value={filtros.buscar}
          onChange={(e) => onCambiar({ buscar: e.target.value })}
          placeholder="Buscar juego, por ejemplo: Catan, cartas..."
          aria-label="Buscar juegos"
          className={campo}
        />
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          className="h-10 shrink-0 border border-ink px-4 text-xs font-bold uppercase tracking-widest md:hidden"
        >
          Filtros {abierto ? '▲' : '▼'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de producto">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => onCambiar({ tipo: t.valor })}
            aria-pressed={filtros.tipo === t.valor}
            className={`h-8 border border-ink px-3 text-[11px] font-bold uppercase tracking-widest transition ${
              filtros.tipo === t.valor ? 'bg-ink text-paper' : 'hover:bg-ink/10'
            }`}
          >
            {t.texto}
          </button>
        ))}
      </div>

      <div className={`${abierto ? 'grid' : 'hidden'} gap-4 md:grid md:grid-cols-2 lg:grid-cols-4`}>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-widest">
          Precio máximo: S/ {Math.round(precioMax)}
          <input
            type="range"
            min={0}
            max={precioTope}
            step={5}
            value={precioMax}
            onChange={(e) => {
              const valor = Number(e.target.value)
              onCambiar({ precioMax: valor >= precioTope ? null : valor })
            }}
            className="block w-full accent-[#ff2e93]"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold uppercase tracking-widest">
          Ordenar por
          <select
            value={filtros.orden}
            onChange={(e) => onCambiar({ orden: e.target.value as Orden })}
            className={`${campo} font-normal normal-case tracking-normal`}
          >
            {opcionesOrden.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.texto}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filtros.soloOfertas}
              onChange={(e) => onCambiar({ soloOfertas: e.target.checked })}
              className="size-4 accent-[#ff2e93]"
            />
            Solo ofertas
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filtros.soloDisponibles}
              onChange={(e) => onCambiar({ soloDisponibles: e.target.checked })}
              className="size-4 accent-[#ff2e93]"
            />
            Solo con stock
          </label>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onLimpiar}
            disabled={!hayFiltros}
            className="h-10 w-full border border-ink px-4 text-xs font-bold uppercase tracking-widest transition hover:bg-ink hover:text-paper disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  )
}

export default BuscadorFiltros
