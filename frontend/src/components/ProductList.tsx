import ProductCard from '@/components/ProductCard'
import type { Producto } from '@/types/producto'

interface ProductListProps {
  productos: Producto[]
  onVer: (producto: Producto) => void
  mensajeVacio?: string
}

function ProductList({
  productos,
  onVer,
  mensajeVacio = 'No encontramos juegos con esos filtros. Prueba con otra búsqueda.',
}: ProductListProps) {
  if (productos.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">{mensajeVacio}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} onVer={onVer} />
      ))}
    </div>
  )
}

export default ProductList
