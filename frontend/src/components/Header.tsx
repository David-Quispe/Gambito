import { useEffect, useRef, useState } from 'react'
import type { Usuario } from '@/types/producto'

const enlaces = [
  { numero: '01', texto: 'Destacado', href: '#destacado' },
  { numero: '02', texto: 'Categorías', href: '#categorias' },
  { numero: '03', texto: 'Catálogo', href: '#catalogo' },
  { numero: '04', texto: 'Recomendados', href: '#recomendados' },
  { numero: '05', texto: 'Contacto', href: '#contacto' },
]

interface HeaderProps {
  usuario: Usuario | null
  enInventario: boolean
  enPedidos: boolean
  enDeseos: boolean
  enNovedades: boolean
  cantidadCarrito: number
  onCarrito: () => void
  onPedidos: () => void
  onDeseos: () => void
  onNovedades: () => void
  onIngresar: () => void
  onRegistrarse: () => void
  onSalir: () => void
  onInventario: () => void
  onTienda: () => void
}

function Header({
  usuario,
  enInventario,
  enPedidos,
  enDeseos,
  enNovedades,
  cantidadCarrito,
  onCarrito,
  onPedidos,
  onDeseos,
  onNovedades,
  onIngresar,
  onRegistrarse,
  onSalir,
  onInventario,
  onTienda,
}: HeaderProps) {
  // Menú de secciones para pantallas pequeñas y menú de la cuenta (desplegable)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [cuentaAbierta, setCuentaAbierta] = useState(false)
  const contenedorCuenta = useRef<HTMLDivElement>(null)

  // El desplegable de la cuenta se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!cuentaAbierta) return
    const fuera = (e: MouseEvent) => {
      if (!contenedorCuenta.current?.contains(e.target as Node)) setCuentaAbierta(false)
    }
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setCuentaAbierta(false)
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [cuentaAbierta])

  const cerrar = () => {
    setMenuAbierto(false)
    setCuentaAbierta(false)
  }
  const botonBase = 'h-9 px-4 text-xs font-bold uppercase tracking-widest transition'
  // En las vistas internas (inventario, pedidos, favoritos, novedades) se esconde el menú de la tienda
  const enOtraVista = enInventario || enPedidos || enDeseos || enNovedades

  // Opciones de la cuenta: se usan en el desplegable (pantallas grandes) y en el menú móvil
  const opcionesCuenta = usuario
    ? [
        { texto: 'Favoritos', accion: onDeseos, visible: !enDeseos, estilo: '' },
        { texto: 'Mis pedidos', accion: onPedidos, visible: !enPedidos, estilo: '' },
        { texto: 'Inventario', accion: onInventario, visible: usuario.es_admin && !enInventario, estilo: 'text-peach' },
        { texto: 'Salir', accion: onSalir, visible: true, estilo: 'border-t border-paper/15 text-paper/70' },
      ].filter((o) => o.visible)
    : []

  const etiquetaUsuario = usuario && (
    <>
      <span className="max-w-[8rem] truncate font-bold">{usuario.username}</span>
      {usuario.es_admin && (
        <span className="bg-hot px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
      )}
    </>
  )

  const botonesAcceso = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          cerrar()
          onIngresar()
        }}
        className={`${botonBase} border border-paper/40 text-paper hover:bg-paper/10`}
      >
        Ingresar
      </button>
      <button
        type="button"
        onClick={() => {
          cerrar()
          onRegistrarse()
        }}
        className={`${botonBase} bg-hot text-white hover:bg-hot/80`}
      >
        Registrarse
      </button>
    </div>
  )

  return (
    <header className="sticky top-0 z-30 bg-ink text-paper">
      <div className="mx-auto flex max-w-[96rem] items-center gap-4 px-4 py-3">
        <a
          href="#destacado"
          onClick={() => {
            if (enOtraVista) onTienda()
          }}
          className="flex shrink-0 items-center gap-3"
        >
          <img src="/logo/gambito-simbolo.svg" alt="Logo de Gambito" className="h-12 w-auto" />
          <span className="font-display text-3xl uppercase leading-none tracking-wide">
            Gambito
            <span className="text-hot">.</span>
          </span>
        </a>

        {/* El espacio sobrante empuja todo lo demás a la derecha */}
        <div className="flex flex-1 items-center justify-center">
          {!enOtraVista && (
            <nav className="hidden items-center gap-5 2xl:flex">
              {enlaces.map((enlace) => (
                <a
                  key={enlace.href}
                  href={enlace.href}
                  className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-paper/70 transition hover:text-peach"
                >
                  <span className="mr-1 text-hot">{enlace.numero}</span>
                  {enlace.texto}
                </a>
              ))}
            </nav>
          )}
          {enOtraVista && (
            <button
              type="button"
              onClick={onTienda}
              className="hidden whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-peach hover:underline sm:block"
            >
              ◀ Volver a la tienda
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!enNovedades && (
            <button
              type="button"
              onClick={onNovedades}
              className="h-10 border border-paper/40 px-3 text-xs font-bold uppercase tracking-widest hover:bg-paper/10"
            >
              <span className="sm:hidden" aria-label="Novedades">★</span>
              <span className="hidden sm:inline">Novedades</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCarrito}
            aria-label={`Abrir carrito (${cantidadCarrito} productos)`}
            className="relative flex h-10 items-center gap-2 border border-paper/40 px-3 text-xs font-bold uppercase tracking-widest hover:bg-paper/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
              <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6" />
            </svg>
            <span className="hidden sm:inline">Carrito</span>
            {cantidadCarrito > 0 && (
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-hot text-[11px] text-white">
                {cantidadCarrito}
              </span>
            )}
          </button>

          {/* Cuenta (pantallas grandes): un solo botón con desplegable */}
          <div className="hidden lg:block" ref={contenedorCuenta}>
            {usuario ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCuentaAbierta((a) => !a)}
                  aria-haspopup="menu"
                  aria-expanded={cuentaAbierta}
                  className="flex h-10 items-center gap-2 border border-paper/40 px-3 text-xs hover:bg-paper/10"
                >
                  {etiquetaUsuario}
                  <span aria-hidden className="text-[10px]">{cuentaAbierta ? '▲' : '▼'}</span>
                </button>
                {cuentaAbierta && (
                  <ul role="menu" className="absolute right-0 top-full z-40 mt-2 w-56 border border-paper/20 bg-ink shadow-xl">
                    {opcionesCuenta.map((o) => (
                      <li key={o.texto} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            cerrar()
                            o.accion()
                          }}
                          className={`block w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-widest hover:bg-paper/10 ${o.estilo}`}
                        >
                          {o.texto}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              botonesAcceso
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuAbierto((a) => !a)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            className="flex size-10 items-center justify-center border border-paper/40 text-xl 2xl:hidden"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Menú móvil: secciones de la tienda y opciones de la cuenta */}
      {menuAbierto && (
        <nav className="border-t border-paper/15 bg-ink 2xl:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {!enOtraVista &&
              enlaces.map((enlace) => (
                <li key={enlace.href}>
                  <a
                    href={enlace.href}
                    onClick={cerrar}
                    className="block border-b border-paper/10 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-paper/80"
                  >
                    <span className="mr-2 text-hot">{enlace.numero}</span>
                    {enlace.texto}
                  </a>
                </li>
              ))}
            {enOtraVista && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    cerrar()
                    onTienda()
                  }}
                  className="block w-full border-b border-paper/10 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-peach"
                >
                  ◀ Volver a la tienda
                </button>
              </li>
            )}
            {/* En pantallas grandes la cuenta ya está en el desplegable */}
            <li className="lg:hidden">
              {usuario ? (
                <ul>
                  <li className="flex items-center gap-2 border-b border-paper/10 py-3 text-xs text-paper/70">
                    Hola, {etiquetaUsuario}
                  </li>
                  {opcionesCuenta.map((o) => (
                    <li key={o.texto}>
                      <button
                        type="button"
                        onClick={() => {
                          cerrar()
                          o.accion()
                        }}
                        className={`block w-full border-b border-paper/10 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] ${o.estilo || 'text-paper/80'}`}
                      >
                        {o.texto}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-3">{botonesAcceso}</div>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Header
