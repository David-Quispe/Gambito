import { createContext, useContext } from 'react'

export interface EstadoDeseos {
  ids: Set<number>
  // devuelve false si no hay sesión iniciada
  alternar: (id: number) => Promise<boolean>
  recargar: () => void
  limpiar: () => void
}

export const DeseosContext = createContext<EstadoDeseos | null>(null)

export function useDeseos(): EstadoDeseos {
  const ctx = useContext(DeseosContext)
  if (!ctx) throw new Error('useDeseos debe usarse dentro de <DeseosProvider>')
  return ctx
}
