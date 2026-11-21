import { useEffect, useState } from 'react'
import AuthModal, { type ModoAuth } from '@/components/AuthModal'
import BuscadorFiltros from '@/components/BuscadorFiltros'
import CategoryFilter from '@/components/CategoryFilter'
import CategoryTiles from '@/components/CategoryTiles'
import { Cargando, ErrorCarga } from '@/components/Estado'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import InventarioAdmin from '@/components/InventarioAdmin'
import ProductDetail from '@/components/ProductDetail'
import ProductList from '@/components/ProductList'
import PromoBanner from '@/components/PromoBanner'
import Recomendados from '@/components/Recomendados'
import SectionTitle from '@/components/SectionTitle'
import { borrarToken, leerToken } from '@/lib/sesion'
import {
  cerrarSesion,
  obtenerCategorias,
  obtenerProductos,
  obtenerRecomendados,
  obtenerUsuarioActual,
} from '@/services/api'
import type { Filtros, Producto, Usuario } from '@/types/producto'

// Juegos que rotan en la sección de destacados.
const nombresDestacados = ['Root', 'Catan', 'Wingspan', 'Pandemic']

const filtrosIniciales: Filtros = {
  categoria: 'Todos',
  buscar: '',
  precioMax: null,
  soloOfertas: false,
  soloDisponibles: false,
  orden: '',
}

function App() {
  // todos: catálogo completo (para destacados, conteos y ofertas)
  const [todos, setTodos] = useState<Producto[]>([])
  // productos: lo que devuelve Django según los filtros activos
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [recomendados, setRecomendados] = useState<Producto[]>([])
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales)
  const [detalle, setDetalle] = useState<Producto | null>(null)

  // Sesión: quién está conectado, qué ventana de cuenta está abierta y qué pantalla se ve
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [modalAuth, setModalAuth] = useState<ModoAuth | null>(null)
  const [vista, setVista] = useState<'tienda' | 'inventario'>('tienda')

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  // Carga inicial (y cada vez que se pulsa "Reintentar")
  useEffect(() => {
    let cancelado = false

    Promise.all([obtenerProductos(), obtenerCategorias(), obtenerRecomendados()])
      .then(([lista, listaCategorias, populares]) => {
        if (cancelado) return
        setTodos(lista)
        setCategorias(listaCategorias.map((categoria) => categoria.nombre))
        setRecomendados(populares)
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

  // Si quedó una sesión guardada en el navegador, se comprueba con el servidor
  useEffect(() => {
    if (!leerToken()) return
    let cancelado = false
    obtenerUsuarioActual()
      .then((u) => {
        if (!cancelado) setUsuario(u)
      })
      .catch((e: unknown) => {
        // 401: el token ya no sirve. Si el servidor está apagado se conserva por ahora.
        if (!cancelado && e instanceof Error && 'estado' in e && e.estado === 401) borrarToken()
      })
    return () => {
      cancelado = true
    }
  }, [])

  // Búsqueda y filtros: se piden a Django 300 ms después de la última tecla
  useEffect(() => {
    let cancelado = false
    const espera = setTimeout(() => {
      obtenerProductos(filtros)
        .then((lista) => {
          if (!cancelado) setProductos(lista)
        })
        .catch((e: unknown) => {
          if (!cancelado) setError(e instanceof Error ? e.message : 'Error desconocido')
        })
    }, 300)

    return () => {
      cancelado = true
      clearTimeout(espera)
    }
  }, [filtros, intento])

  function reintentar() {
    setError(null)
    setCargando(true)
    setIntento((n) => n + 1)
  }

  function salir() {
    cerrarSesion().catch(() => undefined)
    setUsuario(null)
    setVista('tienda')
  }

  function volverALaTienda() {
    setVista('tienda')
    setIntento((n) => n + 1) // el stock pudo cambiar, se vuelve a pedir el catálogo
  }

  function cambiarFiltros(cambios: Partial<Filtros>) {
    setFiltros((actuales) => ({ ...actuales, ...cambios }))
  }

  function verOfertas() {
    setFiltros({ ...filtrosIniciales, soloOfertas: true, orden: 'descuento' })
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }

  function seleccionarCategoria(categoria: string) {
    cambiarFiltros({ categoria })
  }

  const destacados = todos.filter((producto) => nombresDestacados.includes(producto.nombre))

  const conteos: Record<string, number> = { Todos: todos.length }
  for (const producto of todos) {
    conteos[producto.categoria] = (conteos[producto.categoria] ?? 0) + 1
  }

  // El deslizador de precio llega hasta el juego más caro (redondeado a decenas)
  const precioTope = Math.max(10, Math.ceil(Math.max(0, ...todos.map((p) => p.precio_final)) / 10) * 10)

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header
        usuario={usuario}
        enInventario={vista === 'inventario'}
        onIngresar={() => setModalAuth('ingresar')}
        onRegistrarse={() => setModalAuth('registro')}
        onSalir={salir}
        onInventario={() => setVista('inventario')}
        onTienda={volverALaTienda}
      />

      {vista === 'inventario' && usuario?.es_admin && <InventarioAdmin onVolver={volverALaTienda} />}

      {vista === 'tienda' && cargando && <Cargando />}

      {vista === 'tienda' && !cargando && error && <ErrorCarga mensaje={error} onReintentar={reintentar} />}

      {vista === 'tienda' && !cargando && !error && (
        <>
          <PromoBanner productos={todos} onVerOfertas={verOfertas} />

          {destacados.length > 0 && <Hero destacados={destacados} />}

          <CategoryTiles
            categorias={categorias}
            productos={todos}
            onSeleccionar={seleccionarCategoria}
          />

          <section id="catalogo" className="mx-auto max-w-6xl space-y-6 px-4 pb-16">
            <SectionTitle
              numero="03"
              titulo="Nuestro catálogo"
              derecha={`${productos.length} de ${todos.length} juegos`}
            />

            <BuscadorFiltros
              filtros={filtros}
              precioTope={precioTope}
              onCambiar={cambiarFiltros}
              onLimpiar={() => setFiltros({ ...filtrosIniciales, categoria: filtros.categoria })}
            />

            <CategoryFilter
              categorias={categorias}
              categoriaSeleccionada={filtros.categoria}
              conteos={conteos}
              onSeleccionar={seleccionarCategoria}
            />

            <ProductList productos={productos} onVer={setDetalle} />
          </section>

          <Recomendados productos={recomendados} onVer={setDetalle} />
        </>
      )}

      <Footer />

      {modalAuth && (
        <AuthModal
          modoInicial={modalAuth}
          onCerrar={() => setModalAuth(null)}
          onExito={(u) => {
            setUsuario(u)
            setModalAuth(null)
            if (u.es_admin) setVista('inventario')
          }}
        />
      )}

      {detalle && (
        <ProductDetail
          key={detalle.id}
          producto={detalle}
          onCerrar={() => setDetalle(null)}
          onVer={setDetalle}
        />
      )}
    </div>
  )
}

export default App
