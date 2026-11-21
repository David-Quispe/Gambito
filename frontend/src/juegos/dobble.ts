// Dobble con 31 cartas de 6 símbolos: dos cartas cualesquiera comparten exactamente un símbolo.
// El mazo sale de un plano proyectivo de orden 5 (5² + 5 + 1 = 31 símbolos y cartas).

export const SIMBOLOS = [
  '🐶', '🐱', '🦊', '🐻', '🐼', '🐸', '🦁', '🐙', '🦋', '🐢', '🐧', '🦉', '🐝', '🦄', '🐳', '🍎',
  '🍌', '🍇', '🍉', '🍕', '🍩', '⚽', '🎲', '🎸', '🚀', '⭐', '🌙', '🔥', '❄️', '🌈', '🍀',
]

const ORDEN = 5

// Cada carta es una lista de 6 índices de símbolos
export function crearMazoDobble(): number[][] {
  const cartas: number[][] = []
  // Carta "del infinito" y las del primer bloque
  const primera = [0]
  for (let i = 0; i < ORDEN; i++) primera.push(i + 1)
  cartas.push(primera)
  for (let j = 0; j < ORDEN; j++) {
    const carta = [0]
    for (let k = 0; k < ORDEN; k++) carta.push(ORDEN + 1 + ORDEN * j + k)
    cartas.push(carta)
  }
  for (let i = 0; i < ORDEN; i++) {
    for (let j = 0; j < ORDEN; j++) {
      const carta = [i + 1]
      for (let k = 0; k < ORDEN; k++) carta.push(ORDEN + 1 + ORDEN * k + ((i * k + j) % ORDEN))
      cartas.push(carta)
    }
  }
  return cartas
}

export function simboloComun(a: number[], b: number[]): number {
  return a.find((s) => b.includes(s)) as number
}

export interface RondaDobble {
  izquierda: number[]
  derecha: number[]
  comun: number
}

export const RONDAS = 12

function mezclar<T>(lista: T[], azar: () => number): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

// Las rondas usan cartas distintas; los símbolos de cada carta se barajan para que no tengan un orden fijo
export function crearRondas(azar: () => number = Math.random): RondaDobble[] {
  const mazo = mezclar(crearMazoDobble(), azar)
  const rondas: RondaDobble[] = []
  for (let i = 0; i < RONDAS; i++) {
    const a = mazo[2 * i]
    const b = mazo[2 * i + 1]
    rondas.push({ izquierda: mezclar(a, azar), derecha: mezclar(b, azar), comun: simboloComun(a, b) })
  }
  return rondas
}
