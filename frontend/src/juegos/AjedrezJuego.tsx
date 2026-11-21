import { useEffect, useMemo, useState } from 'react'
import {
  aFEN,
  aUCI,
  aplicar,
  enJaque,
  estadoInicial,
  jugadasLegales,
  mejorJugadaLocal,
  resultado,
  type Estado,
  type Mov,
} from '@/juegos/ajedrez'
import { leerToken } from '@/lib/sesion'
import { pedirJugadaIA } from '@/services/api'

const GLIFOS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

interface Partida {
  estado: Estado
  historial: string[]
  ultimo: [number, number] | null
}

const TEXTO_FIN: Record<string, string> = {
  cincuenta: 'Tablas: 50 jugadas sin capturas ni movimientos de peón.',
  material: 'Tablas: no queda material para dar mate.',
  ahogado: 'Tablas: rey ahogado.',
}

function AjedrezJuego() {
  const [partida, setPartida] = useState<Partida>({ estado: estadoInicial(), historial: [], ultimo: null })
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [pensando, setPensando] = useState(false)
  const [fuente, setFuente] = useState<'ia' | 'local' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const { estado } = partida
  const fin = useMemo(() => resultado(estado), [estado])
  const legales = useMemo(() => (estado.turno === 'w' && !fin ? jugadasLegales(estado) : []), [estado, fin])
  const destinos = seleccion === null ? [] : legales.filter((m) => m.desde === seleccion)
  const reyEnJaque = enJaque(estado) ? estado.t.indexOf(estado.turno === 'w' ? 'K' : 'k') : -1

  function jugar(m: Mov) {
    setPartida((p) => ({ estado: aplicar(p.estado, m), historial: [...p.historial, aUCI(m)], ultimo: [m.desde, m.hasta] }))
  }

  // Turno de las negras: primero se le pide la jugada a la IA y, si falla, juega el bot local
  useEffect(() => {
    if (estado.turno !== 'b' || fin) return
    let cancelado = false
    // pequeña espera: evita llamadas dobles cuando React monta y desmonta el efecto en desarrollo
    const id = window.setTimeout(async () => {
      setPensando(true)
      const posibles = jugadasLegales(estado)
      let elegida: Mov | undefined
      if (leerToken()) {
        try {
          const { jugada } = await pedirJugadaIA(aFEN(estado), posibles.map(aUCI), partida.historial.slice(-30).join(' '))
          elegida = posibles.find((m) => aUCI(m) === jugada)
          if (elegida) {
            setFuente('ia')
            setAviso(null)
          }
        } catch (e) {
          setAviso(`La IA no respondió (${e instanceof Error ? e.message : 'error'}). Juega el bot básico.`)
        }
      } else {
        setAviso('Inicia sesión para jugar contra la IA. Por ahora juega el bot básico.')
      }
      if (!elegida) {
        elegida = mejorJugadaLocal(estado) ?? undefined
        setFuente('local')
      }
      if (cancelado || !elegida) return
      setPensando(false)
      jugar(elegida)
    }, 350)
    return () => {
      cancelado = true
      window.clearTimeout(id)
    }
    // solo se vuelve a ejecutar cuando cambia la posición
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  function tocar(sq: number) {
    if (estado.turno !== 'w' || fin) return
    const jugada = destinos.find((m) => m.hasta === sq && (!m.promo || m.promo === 'q')) // se corona siempre a dama
    if (jugada) {
      setSeleccion(null)
      jugar(jugada)
      return
    }
    setSeleccion(legales.some((m) => m.desde === sq) ? sq : null)
  }

  let mensaje = 'Tu turno: juegas con las blancas.'
  if (fin === 'jaquemate') mensaje = estado.turno === 'b' ? '¡Jaque mate! Ganaste.' : 'Jaque mate. Ganó el rival.'
  else if (fin) mensaje = TEXTO_FIN[fin]
  else if (pensando || estado.turno === 'b') mensaje = 'El rival está pensando...'
  else if (reyEnJaque >= 0) mensaje = '¡Estás en jaque!'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
        <span>Tú: blancas</span>
        <span>{fuente === 'ia' ? 'Rival: IA (Gemini)' : fuente === 'local' ? 'Rival: bot básico' : 'Rival: negras'}</span>
      </div>

      <div className="mx-auto grid aspect-square w-full max-w-md grid-cols-8 border-4 border-ink shadow-lg">
        {estado.t.map((pieza, sq) => {
          const oscura = ((sq >> 3) + (sq & 7)) % 2 === 1
          const esDestino = destinos.some((m) => m.hasta === sq)
          const ultimo = partida.ultimo?.includes(sq)
          return (
            <button
              key={sq}
              type="button"
              onClick={() => tocar(sq)}
              aria-label={`Casilla ${'abcdefgh'[sq & 7]}${8 - (sq >> 3)}${pieza ? ` ${GLIFOS[pieza]}` : ''}`}
              className={`relative flex items-center justify-center text-3xl leading-none sm:text-4xl ${oscura ? 'bg-emerald-800' : 'bg-amber-100'} ${
                ultimo ? 'ring-2 ring-inset ring-yellow-300' : ''
              } ${seleccion === sq ? 'ring-4 ring-inset ring-sky-400' : ''} ${reyEnJaque === sq ? 'bg-red-500' : ''}`}
            >
              {esDestino && <span className={`absolute rounded-full bg-sky-400/80 ${pieza ? 'size-4/5 opacity-50' : 'size-1/3'}`} />}
              {pieza && (
                <span className={`relative ${pieza === pieza.toUpperCase() ? 'text-white [text-shadow:0_0_3px_#000,0_0_3px_#000]' : 'text-black'}`}>{GLIFOS[pieza]}</span>
              )}
            </button>
          )
        })}
      </div>

      <p role="status" className="border border-ink/20 bg-card px-3 py-2 text-center text-sm">
        {mensaje}
      </p>
      {aviso && <p className="text-center text-[11px] text-muted-foreground">{aviso}</p>}
      <p className="text-center text-[11px] text-muted-foreground">Al coronar un peón se convierte siempre en dama.</p>
    </div>
  )
}

export default AjedrezJuego
