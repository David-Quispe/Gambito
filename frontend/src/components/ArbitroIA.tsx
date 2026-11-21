import { useEffect, useRef, useState } from 'react'
import { leerToken } from '@/lib/sesion'
import { preguntarArbitro, type MensajeArbitro } from '@/services/api'

const SUGERENCIAS = ['¿Cómo preparo la mesa?', 'Explícame mi primer turno', '¿Cómo se gana?']

interface ArbitroIAProps {
  idProducto: number
  nombre: string
  style?: React.CSSProperties
}

// Chat con el árbitro: responde dudas de reglas usando la información cargada del juego.
function ArbitroIA({ idProducto, nombre, style }: ArbitroIAProps) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<MensajeArbitro[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fin = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [abierto])

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes, enviando])

  async function enviar(pregunta: string) {
    const limpia = pregunta.trim()
    if (!limpia || enviando) return
    setError(null)
    const previos = mensajes
    setMensajes([...previos, { rol: 'usuario', texto: limpia }])
    setTexto('')
    setEnviando(true)
    try {
      const { respuesta } = await preguntarArbitro(idProducto, limpia, previos)
      setMensajes((m) => [...m, { rol: 'ia', texto: respuesta }])
    } catch (e) {
      setError(e instanceof TypeError ? 'No pudimos conectar con el servidor.' : e instanceof Error ? e.message : 'No se pudo consultar al árbitro.')
    } finally {
      setEnviando(false)
    }
  }

  const haySesion = !!leerToken()

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        style={style}
        className="h-10 border-2 border-current px-5 text-xs font-bold uppercase tracking-widest transition hover:opacity-80"
      >
        ? Preguntar al árbitro
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 sm:items-center sm:p-4" onClick={() => setAbierto(false)} role="dialog" aria-modal="true" aria-label={`Árbitro de ${nombre}`}>
          <div className="flex h-[85vh] w-full max-w-xl flex-col bg-paper text-ink shadow-2xl sm:h-[34rem]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-ink px-5 py-3 text-paper">
              <p className="font-display text-2xl uppercase leading-none tracking-wide">
                Árbitro · {nombre}
                <span className="text-hot">.</span>
              </p>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="size-9 border border-paper/40 text-lg hover:bg-paper/10">
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!haySesion ? (
                <p className="border border-hot bg-hot/10 px-3 py-2 text-sm">Inicia sesión para preguntarle al árbitro.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Pregúntame lo que quieras sobre las reglas de {nombre}.</p>
                  {mensajes.length === 0 && (
                    <div className="flex flex-wrap gap-2">
                      {SUGERENCIAS.map((s) => (
                        <button key={s} type="button" onClick={() => enviar(s)} className="border border-ink/40 px-3 py-1.5 text-xs font-semibold hover:bg-ink hover:text-paper">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              {mensajes.map((m, i) => (
                <p key={i} className={`max-w-[88%] whitespace-pre-wrap px-3 py-2 text-sm ${m.rol === 'usuario' ? 'ml-auto bg-ink text-paper' : 'border border-ink/20 bg-card'}`}>
                  {m.texto}
                </p>
              ))}
              {enviando && <p className="w-fit border border-ink/20 bg-card px-3 py-2 text-sm text-muted-foreground">El árbitro está pensando...</p>}
              {error && (
                <p role="alert" className="border border-hot bg-hot/10 px-3 py-2 text-sm">
                  {error}
                </p>
              )}
              <div ref={fin} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                enviar(texto)
              }}
              className="flex gap-2 border-t border-ink/20 p-3"
            >
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={400}
                disabled={!haySesion}
                placeholder="Escribe tu duda..."
                aria-label="Tu pregunta"
                className="h-11 flex-1 border border-ink bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-hot disabled:opacity-50"
              />
              <button type="submit" disabled={!haySesion || enviando || !texto.trim()} className="h-11 bg-ink px-5 text-xs font-bold uppercase tracking-widest text-paper hover:bg-hot disabled:opacity-50">
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ArbitroIA
