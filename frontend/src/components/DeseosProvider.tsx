import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { DeseosContext, type EstadoDeseos } from '@/lib/deseos'
import { leerToken } from '@/lib/sesion'
import { agregarDeseo, obtenerDeseos, quitarDeseo } from '@/services/api'

// Guarda qué productos tiene deseados la persona con sesión iniciada.
function DeseosProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<number>>(new Set())

  const recargar = useCallback(() => {
    obtenerDeseos()
      .then((lista) => setIds(new Set(lista.map((p) => p.id))))
      .catch(() => undefined) // sin conexión o sesión vencida: la lista queda como estaba
  }, [])

  const limpiar = useCallback(() => setIds(new Set()), [])

  const alternar = useCallback(
    async (id: number) => {
      if (!leerToken()) return false
      const yaEra = ids.has(id)
      // se actualiza primero en pantalla y se revierte si el servidor falla
      setIds((prev) => {
        const sig = new Set(prev)
        if (yaEra) sig.delete(id)
        else sig.add(id)
        return sig
      })
      try {
        if (yaEra) await quitarDeseo(id)
        else await agregarDeseo(id)
      } catch {
        setIds((prev) => {
          const sig = new Set(prev)
          if (yaEra) sig.add(id)
          else sig.delete(id)
          return sig
        })
      }
      return true
    },
    [ids],
  )

  const valor = useMemo<EstadoDeseos>(() => ({ ids, alternar, recargar, limpiar }), [ids, alternar, recargar, limpiar])
  return <DeseosContext.Provider value={valor}>{children}</DeseosContext.Provider>
}

export default DeseosProvider
