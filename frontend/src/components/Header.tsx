import { useState } from 'react'
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
  onIngresar: () => void
  onRegistrarse: () => void
  onSalir: () => void
  onInventario: () => void
  onTienda: () => void
}

function Header({ usuario, enInventario, onIngresar, onRegistrarse, onSalir, onInventario, onTienda }: HeaderProps) {
  // Menú desplegable para pantallas pequeñas
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrar = () => setMenuAbierto(false)
  const botonBase = 'h-9 px-4 text-xs font-bold uppercase tracking-widest transition'

  const cuenta = usuario ? (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-paper/70">
        Hola, <span className="font-bold text-paper">{usuario.username}</span>
        {usuario.es_admin && (
          <span className="ml-2 bg-hot px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
        )}
      </span>
      {usuario.es_admin && !enInventario && (
        <button
          type="button"
          onClick={() => {
            cerrar()
            onInventario()
          }}
          className={`${botonBase} bg-peach text-ink hover:bg-peach/80`}
        >
          Inventario
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          cerrar()
          onSalir()
        }}
        className={`${botonBase} border border-paper/40 text-paper hover:bg-paper/10`}
      >
        Salir
      </button>
    </div>
  ) : (
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a
          href="#destacado"
          onClick={() => {
            if (enInventario) onTienda()
          }}
          className="flex items-center gap-3"
        >
          <img src="/logo/gambito-simbolo.svg" alt="Logo de Gambito" className="h-12 w-auto" />
          <span className="font-display text-3xl uppercase leading-none tracking-wide">
            Gambito
            <span className="text-hot">.</span>
          </span>
        </a>

        {!enInventario && (
          <nav className="hidden items-center gap-4 2xl:flex">
            {enlaces.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-paper/70 transition hover:text-peach"
              >
                <span className="mr-1 text-hot">{enlace.numero}</span>
                {enlace.texto}
              </a>
            ))}
          </nav>
        )}

        {enInventario && (
          <button
            type="button"
            onClick={onTienda}
            className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-peach hover:underline sm:block"
          >
            ◀ Volver a la tienda
          </button>
        )}

        <div className="hidden lg:block">{cuenta}</div>

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

      {menuAbierto && (
        <nav className="border-t border-paper/15 bg-ink 2xl:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {!enInventario &&
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
            {enInventario && (
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
            <li className="py-3 lg:hidden">{cuenta}</li>
          </ul>
        </nav>
      )}

    </header>
  )
}

export default Header
