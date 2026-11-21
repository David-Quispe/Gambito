type TipoDato = 'jugadores' | 'duracion' | 'edad'

interface StatBadgeProps {
  tipo: TipoDato
  valor: string
  fondo: string
  color: string
}

const titulos: Record<TipoDato, string> = {
  jugadores: 'Jugadores',
  duracion: 'Duración en minutos',
  edad: 'Edad recomendada',
}

function Icono({ tipo }: { tipo: TipoDato }) {
  const comunes = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: '-rotate-45 size-5',
  }

  if (tipo === 'jugadores') {
    return (
      <svg {...comunes}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M16 5.5a3 3 0 0 1 0 5.5M18 14.5c1.8.8 3 2.6 3 5.5" />
      </svg>
    )
  }
  if (tipo === 'duracion') {
    return (
      <svg {...comunes}>
        <path d="M6 3h12M6 21h12" />
        <path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
      </svg>
    )
  }
  return (
    <svg {...comunes}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}

function StatBadge({ tipo, valor, fondo, color }: StatBadgeProps) {
  // Los productos que no son juegos (dados, pinturas...) no tienen este dato
  if (!valor) return null
  return (
    <div className="flex flex-col items-center gap-2" title={titulos[tipo]}>
      <span className="font-display text-lg leading-none tracking-wide">{valor}</span>
      <span
        className="flex size-10 rotate-45 items-center justify-center rounded-lg"
        style={{ background: fondo, color }}
      >
        <Icono tipo={tipo} />
      </span>
    </div>
  )
}

export default StatBadge
