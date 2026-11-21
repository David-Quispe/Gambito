import { useEffect, useState } from 'react'
import {
  COLORES,
  cartaSuperior,
  jugarCarta,
  nuevaPartida,
  pasar,
  puedeJugar,
  robar,
  turnoDelBot,
  type CartaUno,
  type ColorUno,
} from '@/juegos/uno'

const FONDO: Record<ColorUno, string> = {
  rojo: 'bg-red-600 text-white',
  amarillo: 'bg-yellow-400 text-ink',
  verde: 'bg-green-600 text-white',
  azul: 'bg-blue-600 text-white',
}

const textoValor = (c: CartaUno) => (c.valor === 'salta' ? '⊘' : c.valor === 'comodin' ? '★' : c.valor)

function Carta({ carta, onClick, desactivada, resaltada }: { carta: CartaUno; onClick?: () => void; desactivada?: boolean; resaltada?: boolean }) {
  const clase = carta.color ? FONDO[carta.color] : 'bg-gradient-to-br from-red-600 via-yellow-400 to-blue-600 text-ink'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactivada || !onClick}
      aria-label={`${carta.valor} ${carta.color ?? 'comodín'}`}
      className={`flex h-24 w-16 shrink-0 items-center justify-center rounded-lg border-4 border-white font-display text-3xl shadow-md transition ${clase} ${
        onClick && !desactivada ? 'hover:-translate-y-2' : ''
      } ${desactivada ? 'opacity-45' : ''} ${resaltada ? 'ring-4 ring-ink' : ''}`}
    >
      {textoValor(carta)}
    </button>
  )
}

function UnoJuego() {
  const [p, setP] = useState(() => nuevaPartida())
  const [eligiendo, setEligiendo] = useState<number | null>(null) // comodín esperando color
  const [yaRobo, setYaRobo] = useState(false)

  // Turno del bot, con una pausa para que se pueda seguir la partida
  useEffect(() => {
    if (p.turno !== 'bot' || p.ganador) return
    const id = window.setTimeout(() => setP((actual) => turnoDelBot(actual)), 1100)
    return () => window.clearTimeout(id)
  }, [p])

  const tuTurno = p.turno === 'jugador' && !p.ganador
  const jugables = p.jugador.filter((c) => puedeJugar(c, p))
  const superior = cartaSuperior(p)

  function jugar(c: CartaUno) {
    if (!tuTurno) return
    if (c.color === null) return setEligiendo(c.id)
    setYaRobo(false)
    setP((actual) => jugarCarta(actual, 'jugador', c.id))
  }

  function elegirColor(color: ColorUno) {
    if (eligiendo === null) return
    setYaRobo(false)
    setP((actual) => jugarCarta(actual, 'jugador', eligiendo, color))
    setEligiendo(null)
  }

  function alRobar() {
    const despues = robar(p, 'jugador')
    setYaRobo(despues.turno === 'jugador')
    setP(despues)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest">
        <span>Bot: {p.bot.length} cartas</span>
        <span className={tuTurno ? 'text-hot' : ''}>{p.ganador ? 'Fin' : tuTurno ? 'Tu turno' : 'Turno del bot...'}</span>
      </div>

      <div className="flex justify-center gap-1" aria-hidden>
        {p.bot.slice(0, 14).map((c) => (
          <span key={c.id} className="h-12 w-8 rounded border-2 border-white bg-ink shadow" />
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 py-2">
        <button
          type="button"
          onClick={alRobar}
          disabled={!tuTurno || yaRobo}
          className="flex h-24 w-16 flex-col items-center justify-center rounded-lg border-4 border-white bg-ink text-[10px] font-bold uppercase tracking-wider text-paper shadow-md transition hover:-translate-y-1 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Robar
          <span className="font-display text-xl">{p.mazo.length}</span>
        </button>
        <div className="flex flex-col items-center gap-2">
          <Carta carta={superior} />
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${FONDO[p.color]}`}>Color: {p.color}</span>
        </div>
      </div>

      <p role="status" className="min-h-10 border border-ink/20 bg-card px-3 py-2 text-center text-sm">
        {p.mensaje}
      </p>

      {eligiendo !== null && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest">Elige el color:</span>
          {COLORES.map((c) => (
            <button key={c} type="button" onClick={() => elegirColor(c)} className={`h-10 px-4 text-xs font-bold uppercase tracking-widest ${FONDO[c]}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {tuTurno && yaRobo && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setYaRobo(false)
              setP((actual) => pasar(actual, 'jugador'))
            }}
            className="h-9 border border-ink px-4 text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-paper"
          >
            Pasar turno
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest">
          Tu mano ({p.jugador.length}){tuTurno && jugables.length === 0 && !yaRobo ? ' · no tienes jugada, roba una carta' : ''}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {p.jugador.map((c) => (
            <Carta key={c.id} carta={c} onClick={() => jugar(c)} desactivada={!tuTurno || !puedeJugar(c, p)} resaltada={eligiendo === c.id} />
          ))}
        </div>
      </div>

      {p.ganador && (
        <p className={`px-4 py-3 text-center font-display text-3xl uppercase ${p.ganador === 'jugador' ? 'bg-emerald-600 text-white' : 'bg-hot text-white'}`}>
          {p.ganador === 'jugador' ? '¡Ganaste!' : 'Ganó el bot'}
        </p>
      )}
    </div>
  )
}

export default UnoJuego
