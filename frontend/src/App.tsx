import { useEffect, useState } from 'react'
import CategoryFilter from '@/components/CategoryFilter'
import CategoryTiles from '@/components/CategoryTiles'
import { Cargando, ErrorCarga } from '@/components/Estado'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProductList from '@/components/ProductList'
import SectionTitle from '@/components/SectionTitle'
import { obtenerCategorias, obtenerProductos } from '@/services/api'
import type { Producto } from '@/types/producto'

// Juegos que rotan en la sección de destacados.
const nombresDestacados = ['Root', 'Catan', 'Wingspan', 'Pandemic']

function App() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos')

  // Pide los datos a Django al abrir la página (y cada vez que se pulsa "Reintentar")
  useEffect(() => {
    let cancelado = false

    Promise.all([obtenerProductos(), obtenerCategorias()])
      .then(([listaProductos, listaCategorias]) => {
        if (cancelado) return
        setProductos(listaProductos)
        setCategorias(listaCategorias.map((categoria) => categoria.nombre))
      })
      .catch((e: unknown) => {
        if (cancelado) return
        setError(e instanceof Error ? e.message : 'Error desconocido')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [intento])

  function reintentar() {
    setError(null)
    setCargando(true)
    setIntento((n) => n + 1)
  }

  const productosFiltrados =
    categoriaSeleccionada === 'Todos'
      ? productos
      : productos.filter((producto) => producto.categoria === categoriaSeleccionada)

  const destacados = productos.filter((producto) => nombresDestacados.includes(producto.nombre))

  const conteos: Record<string, number> = { Todos: productos.length }
  for (const producto of productos) {
    conteos[producto.categoria] = (conteos[producto.categoria] ?? 0) + 1
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />

      {cargando && <Cargando />}

      {!cargando && error && <ErrorCarga mensaje={error} onReintentar={reintentar} />}

      {!cargando && !error && (
        <>
          {destacados.length > 0 && <Hero destacados={destacados} />}

          <CategoryTiles
            categorias={categorias}
            productos={productos}
            onSeleccionar={setCategoriaSeleccionada}
          />

          <section id="catalogo" className="mx-auto max-w-6xl space-y-6 px-4 pb-16">
            <SectionTitle
              numero="03"
              titulo="Nuestro catálogo"
              derecha={`${productosFiltrados.length} de ${productos.length} juegos`}
            />

            <CategoryFilter
              categorias={categorias}
              categoriaSeleccionada={categoriaSeleccionada}
              conteos={conteos}
              onSeleccionar={setCategoriaSeleccionada}
            />

            <ProductList productos={productosFiltrados} />
          </section>
        </>
      )}

      <Footer />
    </div>
  )
}

export default App
