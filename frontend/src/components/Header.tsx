const enlaces = [
  { numero: '01', texto: 'Destacado', href: '#destacado' },
  { numero: '02', texto: 'Categorías', href: '#categorias' },
  { numero: '03', texto: 'Catálogo', href: '#catalogo' },
  { numero: '04', texto: 'Contacto', href: '#contacto' },
]

function Header() {
  return (
    <header className="sticky top-0 z-30 bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="#destacado" className="flex items-center gap-3">
          <img
            src="/logo/gambito-simbolo.svg"
            alt="Logo de Gambito"
            className="h-12 w-auto"
          />
          <span className="font-display text-3xl uppercase leading-none tracking-wide">
            Gambito
            <span className="text-hot">.</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {enlaces.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/70 transition hover:text-peach"
            >
              <span className="mr-1 text-hot">{enlace.numero}</span>
              {enlace.texto}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Header
