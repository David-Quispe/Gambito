import ProductCard from '@/components/ProductCard'
import type { Producto } from '@/types/producto'

interface ProductListProps {
  productos: Producto[]
}

function ProductList({ productos }: ProductListProps) {
  if (productos.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No hay productos en esta categoría.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {productos.map((producto) => (
        <ProductCard
          key={producto.id}
          nombre={producto.nombre}
          descripcion={producto.descripcion}
          precio={producto.precio}
          imagen={producto.imagen}
          categoria={producto.categoria}
          stock={producto.stock}
          jugadores={producto.jugadores}
          duracion={producto.duracion}
          edad={producto.edad}
        />
      ))}
    </div>
  )
}

export default ProductList
