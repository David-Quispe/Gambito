import { useEffect, useState, type ReactNode } from 'react'
import { REGLAS, TITULOS, type JuegoJugable } from '@/juegos/registro'

interface ModalJuegoProps {
  juego: JuegoJugable
  onCerrar: () => void
  // recibe un número que cambia en cada "Nueva partida" para reiniciar el juego
  children: (partida: number) => ReactNode
}

// Ventana común para los tres juegos: título, reglas cortas, nueva partida y cerrar.
function ModalJuego({ juego, onCerrar, children }: ModalJuegoProps) {
  const [partida, setPartida] = useState(0)

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alPulsar)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = anterior
    }
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 sm:items-center sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={`Jugar ${TITULOS[juego]} contra el bot`}
    >
      <div className="max-h-[96vh] w-full max-w-3xl overflow-y-auto bg-paper text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 bg-ink px-5 py-3 text-paper">
          <p className="font-display text-3xl uppercase leading-none tracking-wide">
            {TITULOS[juego]} vs bot<span className="text-hot">.</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPartida((n) => n + 1)}
              className="h-9 border border-paper/40 px-3 text-[11px] font-bold uppercase tracking-widest hover:bg-paper/10"
            >
              Nueva partida
            </button>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="size-9 border border-paper/40 text-lg hover:bg-paper/10">
              ✕
            </button>
          </div>
        </div>
        <p className="border-b border-ink/15 bg-card px-5 py-2 text-xs">{REGLAS[juego]}</p>
        <div className="p-4 sm:p-6">{children(partida)}</div>
      </div>
    </div>
  )
}

export default ModalJuego
