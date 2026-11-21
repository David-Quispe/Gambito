import { useEffect, useMemo, useState } from 'react'
import {
  aplicarMovimiento,
  contar,
  elegirMovimientoBot,
  movimientosValidos,
  tableroInicial,
  type Bando,
  type Movimiento,
  type Tablero,
} from '@/juegos/damas'

interface Estado {
  tablero: Tablero
  turno: Bando
  ganador: Bando | 'empate' | null
  sinCaptura: number // jugadas seguidas sin comer: a las 60 se declara empate
  ultimo: [number, number] | null
  mensaje: string
}

const inicial = (): Estado => ({
  tablero: tableroInicial(),
  turno: 'blanca',
  ganador: null,
  sinCaptura: 0,
  ultimo: null,
  mensaje: 'Tu turno: toca una de tus piezas blancas.',
})

// Aplica un movimiento y decide si la partida sigue, termina o es empate
function avanzar(e: Estado, m: Movimiento): Estado {
  const tablero = aplicarMovimiento(e.tablero, m)
  const rival: Bando = e.turno === 'blanca' ? 'negra' : 'blanca'
  const sinCaptura = m.capturas.length > 0 ? 0 : e.sinCaptura + 1
  const destino = m.camino[m.camino.length - 1]
  if (movimientosValidos(tablero, rival).length === 0) {
    return { tablero, turno: rival, ganador: e.turno, sinCaptura, ultimo: destino, mensaje: e.turno === 'blanca' ? '¡Ganaste la partida!' : 'El bot ganó la partida.' }
  }
  if (sinCaptura >= 60) {
    return { tablero, turno: rival, ganador: 'empate', sinCaptura, ultimo: destino, mensaje: 'Empate: 60 jugadas sin comer.' }
  }
  const comio = m.capturas.length
  return {
    tablero,
    turno: rival,
    ganador: null,
    sinCaptura,
    ultimo: destino,
    mensaje:
      e.turno === 'negra'
        ? comio > 0
          ? `El bot comió ${comio} pieza${comio > 1 ? 's' : ''}. Es tu turno.`
          : 'Tu turno.'
        : 'Turno del bot...',
  }
}

const mismo = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1]

function DamasJuego() {
  const [e, setE] = useState<Estado>(inicial)
  const [seleccion, setSeleccion] = useState<[number, number] | null>(null)

  const tuTurno = e.turno === 'blanca' && !e.ganador
  const movimientos = useMemo(() => (tuTurno ? movimientosValidos(e.tablero, 'blanca') : []), [e.tablero, tuTurno])
  const deLaSeleccion = seleccion ? movimientos.filter((m) => mismo(m.desde, seleccion)) : []

  // Jugada del bot con una pausa corta
  useEffect(() => {
    if (e.turno !== 'negra' || e.ganador) return
    const id = window.setTimeout(() => {
      setE((actual) => {
        const m = elegirMovimientoBot(actual.tablero)
        return m ? avanzar(actual, m) : actual
      })
    }, 700)
    return () => window.clearTimeout(id)
  }, [e.turno, e.ganador, e.tablero])

  function tocar(f: number, c: number) {
    if (!tuTurno) return
    const destino = deLaSeleccion.find((m) => mismo(m.camino[m.camino.length - 1], [f, c]))
    if (destino) {
      setSeleccion(null)
      setE((actual) => avanzar(actual, destino))
      return
    }
    // elegir (o cambiar de) pieza: solo las que tienen jugada, porque comer es obligatorio
    if (movimientos.some((m) => mismo(m.desde, [f, c]))) setSeleccion([f, c])
    else {
      setSeleccion(null)
      if (e.tablero[f][c]?.bando === 'blanca') {
        const obligadas = movimientos.some((m) => m.capturas.length > 0)
        setE((actual) => ({ ...actual, mensaje: obligadas ? 'Tienes que comer: elige una pieza que pueda capturar.' : 'Esa pieza no tiene jugadas.' }))
      }
    }
  }

  const puedeComer = movimientos.some((m) => m.capturas.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest">
        <span>Tú (blancas): {contar(e.tablero, 'blanca')}</span>
        <span className={tuTurno ? 'text-hot' : ''}>{e.ganador ? 'Fin' : tuTurno ? 'Tu turno' : 'Turno del bot...'}</span>
        <span>Bot (negras): {contar(e.tablero, 'negra')}</span>
      </div>

      <div className="mx-auto grid aspect-square w-full max-w-md grid-cols-8 border-4 border-ink shadow-lg">
        {e.tablero.map((fila, f) =>
          fila.map((pieza, c) => {
            const oscura = (f + c) % 2 === 1
            const esSeleccion = seleccion !== null && mismo(seleccion, [f, c])
            const esDestino = deLaSeleccion.some((m) => mismo(m.camino[m.camino.length - 1], [f, c]))
            const esUltimo = e.ultimo !== null && mismo(e.ultimo, [f, c])
            return (
              <button
                key={`${f}-${c}`}
                type="button"
                onClick={() => tocar(f, c)}
                disabled={!oscura}
                aria-label={`Casilla ${f + 1}-${c + 1}${pieza ? ` ${pieza.bando}${pieza.dama ? ' dama' : ''}` : ''}`}
                className={`relative flex items-center justify-center ${oscura ? 'bg-amber-800' : 'bg-amber-100'} ${esUltimo ? 'ring-2 ring-inset ring-yellow-300' : ''} ${
                  esSeleccion ? 'ring-4 ring-inset ring-sky-400' : ''
                }`}
              >
                {esDestino && <span className="absolute size-1/3 rounded-full bg-sky-400/80" />}
                {pieza && (
                  <span
                    className={`flex size-4/5 items-center justify-center rounded-full border-2 text-lg shadow-md sm:text-2xl ${
                      pieza.bando === 'blanca' ? 'border-stone-300 bg-stone-50 text-amber-600' : 'border-stone-600 bg-stone-900 text-yellow-300'
                    }`}
                  >
                    {pieza.dama ? '♛' : ''}
                  </span>
                )}
              </button>
            )
          }),
        )}
      </div>

      <p role="status" className={`border px-3 py-2 text-center text-sm ${tuTurno && puedeComer ? 'border-hot bg-hot/10' : 'border-ink/20 bg-card'}`}>
        {tuTurno && puedeComer && !e.mensaje.startsWith('Tienes') ? 'Tienes captura obligatoria: elige la pieza que puede comer.' : e.mensaje}
      </p>

      {e.ganador && (
        <p
          className={`px-4 py-3 text-center font-display text-3xl uppercase ${
            e.ganador === 'blanca' ? 'bg-emerald-600 text-white' : e.ganador === 'negra' ? 'bg-hot text-white' : 'bg-ink text-paper'
          }`}
        >
          {e.ganador === 'blanca' ? '¡Ganaste!' : e.ganador === 'negra' ? 'Ganó el bot' : 'Empate'}
        </p>
      )}
    </div>
  )
}

export default DamasJuego
