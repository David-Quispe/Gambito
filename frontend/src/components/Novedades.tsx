import { useEffect, useState } from 'react'
import SectionTitle from '@/components/SectionTitle'
import { usarRespaldo } from '@/lib/imagen'
import { obtenerNovedades, participarEn, salirDe } from '@/services/api'
import type { Novedad, TipoNovedad } from '@/types/novedad'
import type { Usuario } from '@/types/producto'

const FILTROS: { id: TipoNovedad | 'todas'; texto: string }[] = [
  { id: 'todas', texto: 'Todas' },
  { id: 'torneo', texto: 'Torneos' },
  { id: 'sorteo', texto: 'Sorteos' },
  { id: 'nuevo', texto: 'Juegos nuevos' },
]

const colorTipo: Record<TipoNovedad, string> = {
  torneo: 'bg-ink text-paper',
  sorteo: 'bg-hot text-white',
  nuevo: 'bg-emerald-700 text-white',
}

const simbolo: Record<TipoNovedad, string> = { torneo: '♞', sorteo: '🎁', nuevo: '★' }

// Imagen del juego vinculado (premio del sorteo, juego del torneo o juego nuevo).
// Si la novedad no tiene juego, se muestra un bloque decorativo del color de su tipo.
function PortadaNovedad({ novedad }: { novedad: Novedad }) {
  if (!novedad.producto_imagen) {
    return (
      <div className={`flex h-40 items-center justify-center text-6xl opacity-90 ${colorTipo[novedad.tipo]}`} aria-hidden>
        {simbolo[novedad.tipo]}
      </div>
    )
  }
  return (
    <div className="relative flex h-48 items-center justify-center bg-gradient-to-b from-ink/10 to-ink/0 p-3">
      <img
        src={novedad.producto_imagen}
        alt={novedad.producto_nombre ?? novedad.titulo}
        loading="lazy"
        onError={(e) => usarRespaldo(e, novedad.producto_nombre ?? novedad.titulo)}
        className="max-h-full max-w-full object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.4)]"
      />
      {novedad.producto_nombre && (
        <span className="absolute bottom-2 left-2 bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-paper">
          {novedad.tipo === 'sorteo' ? 'Premio: ' : ''}
          {novedad.producto_nombre}
        </span>
      )}
    </div>
  )
}

interface NovedadesProps {
  usuario: Usuario | null
  onIngresar: () => void
  onVolver: () => void
  onVerCatalogo: () => void
}

// Torneos, sorteos y juegos recién llegados. Cualquiera los ve; para participar hay que entrar.
function Novedades({ usuario, onIngresar, onVolver, onVerCatalogo }: NovedadesProps) {
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [filtro, setFiltro] = useState<TipoNovedad | 'todas'>('todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ocupada, setOcupada] = useState<number | null>(null)

  // Se vuelve a pedir al entrar o salir de sesión para saber en cuáles participa la persona
  useEffect(() => {
    let cancelado = false
    obtenerNovedades()
      .then((lista) => {
        if (!cancelado) setNovedades(lista)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudieron cargar las novedades')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [usuario])

  async function alternar(n: Novedad) {
    if (!usuario) return onIngresar()
    setOcupada(n.id)
    setError(null)
    try {
      const nueva = n.participo ? await salirDe(n.id) : await participarEn(n.id)
      setNovedades((lista) => lista.map((x) => (x.id === nueva.id ? nueva : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la inscripción')
      // por si el cupo se llenó mientras tanto
      obtenerNovedades().then(setNovedades).catch(() => undefined)
    } finally {
      setOcupada(null)
    }
  }

  const visibles = novedades.filter((n) => filtro === 'todas' || n.tipo === filtro)

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <SectionTitle numero="NV" titulo="Novedades" derecha="Torneos, sorteos y juegos nuevos" />

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`h-9 border px-4 text-xs font-bold uppercase tracking-widest transition ${
              filtro === f.id ? 'border-ink bg-ink text-paper' : 'border-ink/40 hover:border-ink'
            }`}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {cargando && <p className="text-sm text-muted-foreground">Cargando novedades...</p>}
      {error && (
        <p role="alert" className="border border-hot bg-hot/10 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {!cargando && !error && visibles.length === 0 && (
        <div className="space-y-3 border border-ink/20 bg-card p-8 text-center">
          <p className="font-display text-3xl uppercase">Sin novedades por ahora</p>
          <button type="button" onClick={onVolver} className="h-10 bg-ink px-5 text-xs font-bold uppercase tracking-widest text-paper hover:bg-hot">
            Volver a la tienda
          </button>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {visibles.map((n) => (
          <article key={n.id} className="flex flex-col border border-ink/25 bg-card">
            <div className={`flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-widest ${colorTipo[n.tipo]}`}>
              <span>{n.tipo_nombre}</span>
              {n.tipo !== 'nuevo' && <span>{n.cerrada ? 'Cerrado' : 'Abierto'}</span>}
            </div>
            <PortadaNovedad novedad={n} />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <h3 className="font-serif text-2xl font-bold uppercase leading-tight">{n.titulo}</h3>
              <p className="text-sm">{n.resumen}</p>
              {n.detalle && <p className="text-xs text-muted-foreground">{n.detalle}</p>}

              <dl className="space-y-0.5 text-xs">
                {n.fecha && (
                  <div>
                    <dt className="inline font-semibold uppercase tracking-wider">{n.tipo === 'sorteo' ? 'Participa hasta: ' : 'Fecha: '}</dt>
                    <dd className="inline">{new Date(n.fecha).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })}</dd>
                  </div>
                )}
                {n.lugar && (
                  <div>
                    <dt className="inline font-semibold uppercase tracking-wider">Lugar: </dt>
                    <dd className="inline">{n.lugar}</dd>
                  </div>
                )}
                {n.tipo !== 'nuevo' && (
                  <div>
                    <dt className="inline font-semibold uppercase tracking-wider">Inscritos: </dt>
                    <dd className="inline">
                      {n.participantes}
                      {n.cupos_restantes !== null && ` (quedan ${n.cupos_restantes} cupos)`}
                    </dd>
                  </div>
                )}
              </dl>

              {n.ganador_nombre && (
                <p className="border border-hot bg-hot/10 px-3 py-2 text-sm">
                  🏆 Ganador: <strong>{n.ganador_nombre}</strong>
                </p>
              )}

              <div className="mt-auto pt-1">
                {n.tipo === 'nuevo' ? (
                  <button
                    type="button"
                    onClick={onVerCatalogo}
                    className="h-10 border border-ink px-5 text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-paper"
                  >
                    Ver el catálogo
                  </button>
                ) : n.participo ? (
                  <button
                    type="button"
                    disabled={ocupada === n.id || !!n.ganador_nombre}
                    onClick={() => alternar(n)}
                    className="h-10 border border-ink px-5 text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-paper disabled:opacity-50"
                  >
                    {n.ganador_nombre ? 'Participaste' : '✓ Inscrito · Salirme'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={ocupada === n.id || n.cerrada}
                    onClick={() => alternar(n)}
                    className="h-10 bg-ink px-5 text-xs font-bold uppercase tracking-widest text-paper hover:bg-hot disabled:opacity-50 disabled:hover:bg-ink"
                  >
                    {n.cerrada ? 'Inscripción cerrada' : usuario ? 'Participar' : 'Inicia sesión para participar'}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Novedades
