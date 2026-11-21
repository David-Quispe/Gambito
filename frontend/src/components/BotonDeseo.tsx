import { useEffect, useRef, useState } from 'react'
import { useDeseos } from '@/lib/deseos'

interface BotonDeseoProps {
  id: number
  nombre: string
  className?: string
}

// Corazón para guardar el producto en favoritos. Sin sesión avisa que hay que entrar.
function BotonDeseo({ id, nombre, className = '' }: BotonDeseoProps) {
  const { ids, alternar } = useDeseos()
  const [aviso, setAviso] = useState(false)
  const temporizador = useRef<number | undefined>(undefined)
  const activo = ids.has(id)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  async function alPulsar() {
    if (await alternar(id)) return
    setAviso(true)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setAviso(false), 2200)
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={alPulsar}
        aria-pressed={activo}
        aria-label={activo ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
        className={`flex size-9 items-center justify-center rounded-full border-2 transition hover:scale-110 ${className}`}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 2.8 4.5 6.4 4.5c2 0 3.8 1.1 5.6 3.3 1.8-2.2 3.6-3.3 5.6-3.3 3.6 0 5.6 3.7 4 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
      </button>
      {aviso && (
        <span role="status" className="absolute right-0 top-full z-10 mt-1 w-44 bg-ink px-2 py-1 text-[11px] text-paper shadow">
          Inicia sesión para guardar favoritos.
        </span>
      )}
    </span>
  )
}

export default BotonDeseo
