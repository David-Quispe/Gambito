// Qué juegos de la tienda se pueden jugar contra el bot (se reconocen por el nombre del producto).
export type JuegoJugable = 'uno' | 'dobble' | 'damas' | 'ajedrez'

export function juegoJugable(nombre: string): JuegoJugable | null {
  const n = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
  if (n === 'uno') return 'uno'
  if (n === 'dobble') return 'dobble'
  if (n === 'damas') return 'damas'
  if (n === 'ajedrez') return 'ajedrez'
  return null
}

export const TITULOS: Record<JuegoJugable, string> = {
  uno: 'Uno',
  dobble: 'Dobble',
  damas: 'Damas',
  ajedrez: 'Ajedrez',
}

export const REGLAS: Record<JuegoJugable, string> = {
  uno: 'Juega una carta del mismo color o número. Salta y +2 hacen perder el turno al rival. Si no puedes jugar, roba. Gana quien se queda sin cartas.',
  dobble:
    'Entre las dos cartas hay un único símbolo igual. Tócalo antes que el bot: gana el punto quien lo encuentre primero. Si te equivocas, pierdes un momento.',
  damas:
    'Tú juegas con las blancas (abajo). Mueves en diagonal y comer es obligatorio; puedes encadenar capturas. Al llegar al otro extremo tu pieza se corona.',
  ajedrez:
    'Tú juegas con las blancas (abajo). Toca una pieza para ver sus jugadas. El rival es una IA; si no está disponible, juega un bot básico. Hay enroque, captura al paso y coronación.',
}
