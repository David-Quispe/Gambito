import { lazy, Suspense, useState } from 'react'
import ModalJuego from '@/juegos/ModalJuego'
import { juegoJugable, TITULOS } from '@/juegos/registro'

const UnoJuego = lazy(() => import('@/juegos/UnoJuego'))
const DobbleJuego = lazy(() => import('@/juegos/DobbleJuego'))
const DamasJuego = lazy(() => import('@/juegos/DamasJuego'))

interface JugarContraBotProps {
  nombre: string
  style?: React.CSSProperties
}

// Botón para probar el juego contra el bot sin salir del detalle. Solo aparece en los juegos que lo permiten.
function JugarContraBot({ nombre, style }: JugarContraBotProps) {
  const [abierto, setAbierto] = useState(false)
  const juego = juegoJugable(nombre)
  if (!juego) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        style={style}
        className="h-10 border-2 border-current px-5 text-xs font-bold uppercase tracking-widest transition hover:opacity-80"
      >
        ▶ Jugar {TITULOS[juego]} contra el bot
      </button>
      {abierto && (
        <ModalJuego juego={juego} onCerrar={() => setAbierto(false)}>
          {(partida) => (
            <Suspense fallback={<p className="py-10 text-center text-sm">Preparando la mesa...</p>}>
              {juego === 'uno' && <UnoJuego key={partida} />}
              {juego === 'dobble' && <DobbleJuego key={partida} />}
              {juego === 'damas' && <DamasJuego key={partida} />}
            </Suspense>
          )}
        </ModalJuego>
      )}
    </>
  )
}

export default JugarContraBot
