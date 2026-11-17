import { usarRespaldo } from '@/lib/imagen'
import { useEffect, useState } from 'react'
import SectionTitle from '@/components/SectionTitle'
import { Button } from '@/components/ui/button'
import type { Producto } from '@/types/producto'

interface HeroProps {
  destacados: Producto[]
}

function Hero({ destacados }: HeroProps) {
  const [indice, setIndice] = useState(0)

  // Cambia solo de juego destacado cada 6 segundos.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setIndice((actual) => (actual + 1) % destacados.length)
    }, 6000)
    return () => clearTimeout(temporizador)
  }, [indice, destacados.length])

  const juego = destacados[indice]
  if (!juego) return null

  return (
    <section id="destacado" className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <SectionTitle numero="01" titulo="Juego destacado" derecha="Selección de la casa" />
      </div>

      <div className="mx-auto mt-6 grid max-w-6xl lg:grid-cols-[1fr_1.15fr]">
        <div key={juego.id} className="animate-in fade-in slide-in-from-left-4 flex flex-col justify-center gap-5 px-4 py-8 duration-500 lg:py-14">
          <h2 className="font-display text-6xl uppercase leading-[0.92] tracking-tight sm:text-8xl">
            {juego.nombre}
            <span className="text-hot">.</span>
          </h2>

          <ul className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-widest">
            {[juego.categoria, `${juego.jugadores} jugadores`, `${juego.duracion} min`, juego.edad].map(
              (etiqueta) => (
                <li key={etiqueta} className="border border-paper/40 px-2.5 py-1">
                  {etiqueta}
                </li>
              ),
            )}
          </ul>

          <p className="max-w-md text-base text-paper/75">{juego.descripcion}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="h-11 rounded-none bg-peach px-6 font-bold uppercase tracking-widest text-ink hover:bg-peach/80"
              asChild
            >
              <a href="#catalogo">Ver catálogo ▶</a>
            </Button>
            <span className="font-display text-3xl text-peach">
              S/ {juego.precio.toFixed(2)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs">
            {destacados.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver ${item.nombre}`}
                className={`font-semibold tracking-widest transition ${
                  i === indice ? 'text-paper' : 'text-paper/40 hover:text-paper/70'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
            <span className="h-0.5 w-24 bg-paper/20">
              <span
                key={indice}
                className="block h-full origin-left animate-[barra_6s_linear] bg-hot"
              />
            </span>
          </div>
        </div>

        <div className="relative min-h-72 overflow-hidden lg:min-h-[28rem]">
          <img
            key={juego.id}
            src={juego.imagen}
            onError={(e) => usarRespaldo(e, juego.nombre)}
            alt={`Ilustración de ${juego.nombre}`}
            className="animate-in fade-in zoom-in-95 absolute inset-0 h-full w-full object-contain p-6 drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)] duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-transparent to-transparent lg:from-ink/60" />
        </div>
      </div>
    </section>
  )
}

export default Hero
