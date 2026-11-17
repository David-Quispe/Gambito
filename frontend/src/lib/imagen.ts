import type { SyntheticEvent } from 'react'

// Si la portada de internet no carga, se usa la ilustración local del juego.
export function usarRespaldo(e: SyntheticEvent<HTMLImageElement>, nombre: string) {
  const img = e.currentTarget
  const slug = nombre.toLowerCase().replace(/\s+/g, '-')
  if (!img.src.endsWith('.svg')) img.src = `/juegos/${slug}.svg`
}
