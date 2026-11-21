import { useEffect, useRef, useState } from 'react'
import { RONDAS, SIMBOLOS, crearRondas } from '@/juegos/dobble'

type Resultado = 'jugador' | 'bot' | null

function CartaDobble({ simbolos, comun, resaltar, onElegir, desactivada }: { simbolos: number[]; comun: number; resaltar: boolean; onElegir: (s: number) => void; desactivada: boolean }) {
  return (
    <div className="relative size-44 rounded-full border-4 border-ink bg-white shadow-lg sm:size-56">
      {simbolos.map((s, i) => {
        const angulo = (i / simbolos.length) * Math.PI * 2 + 0.4
        const tamanos = ['text-4xl', 'text-5xl', 'text-3xl', 'text-5xl', 'text-4xl', 'text-3xl']
        return (
          <button
            key={s}
            type="button"
            disabled={desactivada}
            onClick={() => onElegir(s)}
            aria-label={`Símbolo ${SIMBOLOS[s]}`}
            style={{
              left: `${50 + 33 * Math.cos(angulo)}%`,
              top: `${50 + 33 * Math.sin(angulo)}%`,
              transform: `translate(-50%, -50%) rotate(${(i * 47) % 70 - 30}deg)`,
            }}
            className={`absolute leading-none transition hover:scale-125 ${tamanos[i % tamanos.length]} ${
              resaltar && s === comun ? 'rounded-full bg-emerald-300 ring-4 ring-emerald-600' : ''
            }`}
          >
            {SIMBOLOS[s]}
          </button>
        )
      })}
    </div>
  )
}

function DobbleJuego() {
  const [rondas] = useState(() => crearRondas())
  const [indice, setIndice] = useState(0)
  const [puntos, setPuntos] = useState({ jugador: 0, bot: 0 })
  const [resultado, setResultado] = useState<Resultado>(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [mensaje, setMensaje] = useState('Encuentra el símbolo que está en las dos cartas.')
  const temporizadores = useRef<number[]>([])

  const terminado = indice >= RONDAS
  const ronda = rondas[Math.min(indice, RONDAS - 1)]

  const programar = (fn: () => void, ms: number) => {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }

  useEffect(() => {
    const lista = temporizadores.current
    return () => lista.forEach((id) => window.clearTimeout(id))
  }, [])

  function cerrarRonda(ganador: 'jugador' | 'bot') {
    temporizadores.current.forEach((id) => window.clearTimeout(id))
    temporizadores.current = []
    setResultado(ganador)
    setBloqueado(false)
    setPuntos((p) => ({ ...p, [ganador]: p[ganador] + 1 }))
    setMensaje(ganador === 'jugador' ? '¡Lo encontraste primero!' : 'El bot lo encontró antes.')
    programar(() => {
      setResultado(null)
      setMensaje('Encuentra el símbolo que está en las dos cartas.')
      setIndice((i) => i + 1)
    }, 1500)
  }

  // El bot "encuentra" el símbolo entre 2,5 y 6 segundos después de que empieza la ronda
  useEffect(() => {
    if (terminado || resultado) return
    const espera = 2500 + Math.random() * 3500
    const id = window.setTimeout(() => cerrarRonda('bot'), espera)
    return () => window.clearTimeout(id)
    // cerrarRonda solo usa setters estables y refs: se reinicia únicamente al cambiar de ronda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, resultado, terminado])

  function elegir(s: number) {
    if (resultado || bloqueado || terminado) return
    if (s === ronda.comun) return cerrarRonda('jugador')
    setBloqueado(true)
    setMensaje('¡Ese no es! Espera un momento...')
    programar(() => {
      setBloqueado(false)
      setMensaje('Encuentra el símbolo que está en las dos cartas.')
    }, 1500)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest">
        <span>Tú: {puntos.jugador}</span>
        <span>{terminado ? 'Fin' : `Ronda ${indice + 1} de ${RONDAS}`}</span>
        <span>Bot: {puntos.bot}</span>
      </div>

      {!terminado && (
        <div className="flex flex-wrap items-center justify-center gap-6">
          <CartaDobble simbolos={ronda.izquierda} comun={ronda.comun} resaltar={resultado !== null} onElegir={elegir} desactivada={bloqueado || resultado !== null} />
          <CartaDobble simbolos={ronda.derecha} comun={ronda.comun} resaltar={resultado !== null} onElegir={elegir} desactivada={bloqueado || resultado !== null} />
        </div>
      )}

      <p role="status" className={`border px-3 py-2 text-center text-sm ${bloqueado ? 'border-hot bg-hot/10' : 'border-ink/20 bg-card'}`}>
        {terminado ? 'Se acabaron las rondas.' : mensaje}
      </p>

      {terminado && (
        <p
          className={`px-4 py-3 text-center font-display text-3xl uppercase ${
            puntos.jugador > puntos.bot ? 'bg-emerald-600 text-white' : puntos.jugador < puntos.bot ? 'bg-hot text-white' : 'bg-ink text-paper'
          }`}
        >
          {puntos.jugador > puntos.bot ? `¡Ganaste ${puntos.jugador} a ${puntos.bot}!` : puntos.jugador < puntos.bot ? `Ganó el bot ${puntos.bot} a ${puntos.jugador}` : `Empate ${puntos.jugador} a ${puntos.bot}`}
        </p>
      )}
    </div>
  )
}

export default DobbleJuego
