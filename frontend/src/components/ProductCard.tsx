import { usarRespaldo } from '@/lib/imagen'
import StatBadge from '@/components/StatBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { obtenerTema } from '@/lib/temas'

interface ProductCardProps {
  nombre: string
  descripcion: string
  precio: number
  imagen: string
  categoria: string
  stock: number
  jugadores: string
  duracion: string
  edad: string
}

function ProductCard({
  nombre,
  descripcion,
  precio,
  imagen,
  categoria,
  stock,
  jugadores,
  duracion,
  edad,
}: ProductCardProps) {
  const tema = obtenerTema(categoria)
  const sinStock = stock === 0

  return (
    <Card
      className="group h-full gap-0 overflow-hidden rounded-none border-0 py-0 text-white shadow-lg ring-0"
      style={{ background: tema.fondo }}
    >
      <div className="px-6 pt-7 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
          {categoria}
        </p>
        <h3
          className="mt-1 font-serif text-4xl font-bold uppercase leading-none tracking-wide"
          style={{ color: tema.titulo }}
        >
          {nombre}
        </h3>
      </div>

      <CardContent className="grid flex-1 items-center gap-6 p-6 sm:grid-cols-[1.05fr_1fr]">
        <div className="relative flex h-60 items-center justify-center [perspective:800px]">
          <div
            className="absolute bottom-3 h-4 w-3/5 rounded-[50%] bg-black/40 blur-md transition duration-500 group-hover:w-2/5 group-hover:opacity-60"
            aria-hidden
          />
          <img
            src={imagen}
            alt={`Portada de ${nombre}`}
            loading="lazy"
            onError={(e) => usarRespaldo(e, nombre)}
            className={`relative max-h-full max-w-full -rotate-3 object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)] transition duration-500 ease-out group-hover:-translate-y-3 group-hover:rotate-2 group-hover:scale-110 ${
              sinStock ? 'grayscale' : ''
            }`}
          />
          {sinStock && (
            <span className="absolute left-3 top-3 -rotate-2 bg-black/80 px-3 py-1 font-display text-lg tracking-widest">
              AGOTADO
            </span>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/85">{descripcion}</p>

          <div className="flex gap-5">
            <StatBadge tipo="jugadores" valor={jugadores} fondo={tema.acento} color={tema.acentoTexto} />
            <StatBadge tipo="duracion" valor={duracion} fondo={tema.acento} color={tema.acentoTexto} />
            <StatBadge tipo="edad" valor={edad} fondo={tema.acento} color={tema.acentoTexto} />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 bg-black/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl leading-none" style={{ color: tema.titulo }}>
            S/ {precio.toFixed(2)}
          </span>
          <Badge
            variant="outline"
            className={`border-white/40 text-[11px] uppercase tracking-wider ${
              sinStock ? 'bg-red-500/30 text-white' : 'text-white'
            }`}
          >
            {sinStock ? 'Sin stock' : `${stock} disponibles`}
          </Badge>
        </div>

        <Button
          disabled={sinStock}
          className="h-9 rounded-full px-5 text-xs font-bold uppercase tracking-widest"
          style={{ background: tema.acento, color: tema.acentoTexto }}
        >
          {sinStock ? 'Agotado' : 'Ver juego'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProductCard
