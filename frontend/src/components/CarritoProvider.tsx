import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CarritoContext,
  MAX_POR_PRODUCTO,
  guardarCarrito,
  leerCarrito,
  type EstadoCarrito,
  type ItemCarrito,
} from '@/lib/carrito'
import type { Producto } from '@/types/producto'

// Guarda el carrito en el navegador: no se pierde al recargar la página.
function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(leerCarrito)

  useEffect(() => {
    guardarCarrito(items)
  }, [items])

  const agregar = useCallback(
    (producto: Producto) => {
      const tope = Math.min(producto.stock, MAX_POR_PRODUCTO)
      const actual = items.find((i) => i.id === producto.id)
      if (producto.stock === 0 || (actual && actual.cantidad >= tope)) return false

      const datos = {
        nombre: producto.nombre,
        imagen: producto.imagen,
        precio_final: producto.precio_final,
        stock: producto.stock,
      }
      setItems((previos) =>
        previos.some((i) => i.id === producto.id)
          ? previos.map((i) => (i.id === producto.id ? { ...i, ...datos, cantidad: Math.min(i.cantidad + 1, tope) } : i))
          : [...previos, { id: producto.id, ...datos, cantidad: 1 }],
      )
      return true
    },
    [items],
  )

  const cambiarCantidad = useCallback((id: number, cantidad: number) => {
    setItems((previos) =>
      previos
        .map((i) => (i.id === id ? { ...i, cantidad: Math.min(cantidad, i.stock, MAX_POR_PRODUCTO) } : i))
        .filter((i) => i.cantidad > 0),
    )
  }, [])

  const quitar = useCallback((id: number) => setItems((previos) => previos.filter((i) => i.id !== id)), [])
  const vaciar = useCallback(() => setItems([]), [])

  const sincronizar = useCallback((productos: Producto[]) => {
    setItems((previos) => {
      const siguientes = previos.flatMap((i) => {
        const p = productos.find((x) => x.id === i.id)
        if (!p || p.stock === 0) return []
        return [
          {
            ...i,
            nombre: p.nombre,
            imagen: p.imagen,
            precio_final: p.precio_final,
            stock: p.stock,
            cantidad: Math.min(i.cantidad, p.stock, MAX_POR_PRODUCTO),
          },
        ]
      })
      // Si no cambió nada, se conserva el mismo arreglo para no volver a dibujar
      return JSON.stringify(siguientes) === JSON.stringify(previos) ? previos : siguientes
    })
  }, [])

  const ajustarAStock = useCallback((faltantes: { producto: number; disponible: number }[]) => {
    setItems((previos) =>
      previos
        .map((i) => {
          const f = faltantes.find((x) => x.producto === i.id)
          return f ? { ...i, stock: f.disponible, cantidad: Math.min(i.cantidad, f.disponible) } : i
        })
        .filter((i) => i.cantidad > 0),
    )
  }, [])

  const valor = useMemo<EstadoCarrito>(
    () => ({
      items,
      cantidadTotal: items.reduce((suma, i) => suma + i.cantidad, 0),
      total: items.reduce((suma, i) => suma + i.precio_final * i.cantidad, 0),
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
      sincronizar,
      ajustarAStock,
    }),
    [items, agregar, cambiarCantidad, quitar, vaciar, sincronizar, ajustarAStock],
  )

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>
}

export default CarritoProvider
