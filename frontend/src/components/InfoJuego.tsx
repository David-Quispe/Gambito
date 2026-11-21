import type { ReactNode } from 'react'
import type { Producto } from '@/types/producto'

// Cada línea del texto del admin es un paso o un punto de la lista
const lineas = (texto: string) =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const colorDificultad: Record<string, string> = {
  facil: 'bg-emerald-600 text-white',
  media: 'bg-amber-400 text-ink',
  dificil: 'bg-red-600 text-white',
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-bold uppercase tracking-[0.25em]">
        <span className="mr-2 text-hot">▸</span>
        {titulo}
      </h4>
      {children}
    </section>
  )
}

function Lista({ items, numerada }: { items: string[]; numerada?: boolean }) {
  const Etiqueta = numerada ? 'ol' : 'ul'
  return (
    <Etiqueta
      className={`space-y-1.5 pl-5 text-sm leading-relaxed text-ink/85 ${
        numerada ? 'list-decimal marker:font-bold marker:text-hot' : 'list-disc marker:text-hot'
      }`}
    >
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Etiqueta>
  )
}

// Reglas, componentes y video del juego. Solo muestra las secciones que tienen contenido,
// así los accesorios (y los juegos sin información) no cambian.
function InfoJuego({ producto }: { producto: Producto }) {
  const componentes = lineas(producto.componentes)
  const preparacion = lineas(producto.preparacion)
  const comoJugar = lineas(producto.como_jugar)
  const consejos = lineas(producto.consejos)
  const comoGanar = producto.como_ganar.trim()

  const hayInfo =
    producto.video_id || componentes.length || preparacion.length || comoJugar.length || comoGanar || consejos.length
  if (!hayInfo) return null

  return (
    <div className="space-y-6 border-b border-ink/10 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h4 className="font-serif text-2xl font-bold uppercase">Cómo se juega</h4>
        {producto.dificultad && (
          <span
            className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${colorDificultad[producto.dificultad]}`}
          >
            Dificultad {producto.dificultad_nombre.toLowerCase()}
          </span>
        )}
      </div>

      {producto.video_id && (
        <Seccion titulo="Míralo en video">
          <div className="aspect-video w-full overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${producto.video_id}`}
              title={`Cómo jugar ${producto.nombre}`}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full border-0"
            />
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${producto.video_id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs font-semibold underline underline-offset-2 hover:text-hot"
          >
            ¿No carga? Ábrelo en YouTube
          </a>
        </Seccion>
      )}

      {componentes.length > 0 && (
        <Seccion titulo="Qué trae la caja">
          <Lista items={componentes} />
        </Seccion>
      )}
      {preparacion.length > 0 && (
        <Seccion titulo="Preparación">
          <Lista items={preparacion} numerada />
        </Seccion>
      )}
      {comoJugar.length > 0 && (
        <Seccion titulo="Cómo se juega">
          <Lista items={comoJugar} numerada />
        </Seccion>
      )}
      {comoGanar && (
        <Seccion titulo="Cómo se gana">
          <p className="text-sm leading-relaxed text-ink/85">{comoGanar}</p>
        </Seccion>
      )}
      {consejos.length > 0 && (
        <Seccion titulo="Consejos para tu primera partida">
          <Lista items={consejos} />
        </Seccion>
      )}
    </div>
  )
}

export default InfoJuego
