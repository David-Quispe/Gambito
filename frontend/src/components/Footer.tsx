import type { ReactNode } from 'react'
import SectionTitle from '@/components/SectionTitle'

// Footer solo visual: los enlaces y botones no llevan a ninguna página todavía.

const enlaces = ['Nosotros', 'Términos y condiciones', 'Políticas de privacidad', 'Gambito Puntos']

const medioDePago = ['VISA', 'Mastercard', 'Amex', 'Diners', 'Yape', 'Plin', 'Mercado Pago']

function Icono({ children, etiqueta }: { children: ReactNode; etiqueta: string }) {
  return (
    <a
      href="#contacto"
      onClick={(e) => e.preventDefault()}
      aria-label={etiqueta}
      className="flex size-10 items-center justify-center border border-paper/30 text-paper/80 transition hover:border-hot hover:bg-hot hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </a>
  )
}

function Fila({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center bg-hot text-white">
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {icono}
        </svg>
      </span>
      <span className="text-sm text-paper/85">{children}</span>
    </li>
  )
}

function Footer() {
  return (
    <footer id="contacto" className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl space-y-10 px-4 pt-12">
        <SectionTitle numero="05" titulo="Contacto" derecha="Arequipa · Perú" />

        <h2 className="font-display text-5xl uppercase leading-[0.95] sm:text-7xl">
          Tu próxima partida
          <br />
          empieza aquí<span className="text-hot">.</span>
        </h2>

        <div className="grid gap-10 border-t border-paper/20 pt-10 md:grid-cols-3">
          {/* Marca y redes */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.25em]">Nuestra marca</h3>
            <div className="flex items-center gap-3">
              <img src="/logo/gambito-simbolo.svg" alt="" className="h-14 w-auto" />
              <span className="font-display text-4xl uppercase leading-none tracking-wide">
                Gambito<span className="text-hot">.</span>
              </span>
            </div>
            <p className="max-w-xs text-sm text-paper/65">
              Juegos de mesa para armar la próxima partida con tu familia y amigos.
            </p>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-paper/60">Síguenos</p>
              <div className="flex gap-2">
                <Icono etiqueta="Instagram">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
                </Icono>
                <Icono etiqueta="Facebook">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M13.5 20v-7h2.3l.4-2.7h-2.7V8.6c0-.8.3-1.3 1.4-1.3h1.4V4.9c-.3 0-1.1-.1-2-.1-2.1 0-3.5 1.3-3.5 3.5v2h-2.3V13h2.3v7" />
                </Icono>
                <Icono etiqueta="TikTok">
                  <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
                  <path d="M14 4c.3 2.2 1.8 3.7 4 4" />
                </Icono>
                <Icono etiqueta="WhatsApp">
                  <path d="M4 20l1.2-4.2A8 8 0 1 1 8.4 19L4 20z" />
                  <path d="M9.2 8.8c.3 2.4 2.4 4.6 5 5.4l1.2-1.2-1.8-1-.8.7c-.8-.4-1.5-1.1-1.9-1.9l.7-.8-1-1.8-1.4 0.6z" />
                </Icono>
              </div>
            </div>
          </div>

          {/* Enlaces y medios de pago */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.25em]">Ayuda</h3>
            <ul className="space-y-3 text-sm">
              {enlaces.map((texto) => (
                <li key={texto}>
                  <a
                    href="#contacto"
                    onClick={(e) => e.preventDefault()}
                    className="text-paper/75 transition hover:text-peach"
                  >
                    <span className="mr-2 text-hot">▸</span>
                    {texto}
                  </a>
                </li>
              ))}
            </ul>
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-paper/60">Medios de pago</p>
              <ul className="flex flex-wrap gap-2">
                {medioDePago.map((medio) => (
                  <li
                    key={medio}
                    className="border border-paper/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-paper/80"
                  >
                    {medio}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.25em]">Escríbenos</h3>
            <ul className="space-y-4">
              <Fila
                icono={
                  <>
                    <path d="M4 9l1.5-5h13L20 9" />
                    <path d="M4 9v11h16V9" />
                    <path d="M4 9c0 1.7 1.3 3 2.7 3S9.3 10.7 9.3 9c0 1.7 1.3 3 2.7 3s2.7-1.3 2.7-3c0 1.7 1.3 3 2.7 3S20 10.7 20 9" />
                  </>
                }
              >
                Tiendas · Arequipa, Perú
              </Fila>
              <Fila icono={<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />}>
                987 000 000
              </Fila>
              <Fila
                icono={
                  <>
                    <rect x="3" y="5" width="18" height="14" rx="1" />
                    <path d="M3 7l9 6 9-6" />
                  </>
                }
              >
                informacion@gambito.example
              </Fila>
            </ul>

            <div className="flex w-fit items-center gap-3 border border-paper/30 px-4 py-3">
              <span className="text-2xl" aria-hidden>
                📖
              </span>
              <span className="text-xs font-bold uppercase leading-tight tracking-widest">
                Libro de
                <br />
                reclamaciones
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="mt-10 border-t border-paper/15 bg-black/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-paper/60 sm:flex-row sm:justify-between">
          <p>
            © 2026 · <span className="font-bold text-paper">Gambito</span> · Tienda de juegos de mesa
          </p>
          <p>Proyecto de laboratorio · TECSUP · Tecnologías Emergentes</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
