// Damas en tablero de 8×8. Tú juegas con las blancas (abajo, avanzas hacia arriba) y el bot con las negras.
// Reglas: se mueve en diagonal, comer es obligatorio, se puede encadenar varias capturas
// y al llegar al otro extremo la pieza se corona (la dama se mueve y come también hacia atrás, de a un paso).

export type Bando = 'blanca' | 'negra'

export interface Pieza {
  bando: Bando
  dama: boolean
}

export type Tablero = (Pieza | null)[][] // [fila][columna], fila 0 = arriba

export interface Movimiento {
  desde: [number, number]
  camino: [number, number][] // casillas por las que pasa; la última es el destino
  capturas: [number, number][]
}

export function tableroInicial(): Tablero {
  const t: Tablero = Array.from({ length: 8 }, () => Array<Pieza | null>(8).fill(null))
  for (let f = 0; f < 8; f++) {
    for (let c = 0; c < 8; c++) {
      if ((f + c) % 2 === 1) {
        if (f < 3) t[f][c] = { bando: 'negra', dama: false }
        else if (f > 4) t[f][c] = { bando: 'blanca', dama: false }
      }
    }
  }
  return t
}

const dentro = (f: number, c: number) => f >= 0 && f < 8 && c >= 0 && c < 8

function direcciones(p: Pieza): [number, number][] {
  if (p.dama) return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  return p.bando === 'blanca' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]
}

const filaDeCorona = (b: Bando) => (b === 'blanca' ? 0 : 7)

// Secuencias de captura de una pieza (el tablero se va modificando sobre una copia)
function capturasDesde(t: Tablero, f: number, c: number, pieza: Pieza, hechas: [number, number][], camino: [number, number][], salida: Movimiento[], origen: [number, number]) {
  let seguido = false
  for (const [df, dc] of direcciones(pieza)) {
    const mf = f + df
    const mc = c + dc
    const tf = f + 2 * df
    const tc = c + 2 * dc
    if (!dentro(tf, tc)) continue
    const medio = t[mf][mc]
    if (!medio || medio.bando === pieza.bando) continue
    if (hechas.some(([a, b]) => a === mf && b === mc)) continue
    if (t[tf][tc] !== null && !(tf === origen[0] && tc === origen[1])) continue
    seguido = true
    const nuevasHechas: [number, number][] = [...hechas, [mf, mc]]
    const nuevoCamino: [number, number][] = [...camino, [tf, tc]]
    // si se corona, la captura termina ahí
    if (!pieza.dama && tf === filaDeCorona(pieza.bando)) {
      salida.push({ desde: origen, camino: nuevoCamino, capturas: nuevasHechas })
    } else {
      capturasDesde(t, tf, tc, pieza, nuevasHechas, nuevoCamino, salida, origen)
    }
  }
  if (!seguido && hechas.length > 0) salida.push({ desde: origen, camino, capturas: hechas })
}

export function movimientosValidos(t: Tablero, bando: Bando): Movimiento[] {
  const capturas: Movimiento[] = []
  const simples: Movimiento[] = []
  for (let f = 0; f < 8; f++) {
    for (let c = 0; c < 8; c++) {
      const p = t[f][c]
      if (!p || p.bando !== bando) continue
      capturasDesde(t, f, c, p, [], [], capturas, [f, c])
      for (const [df, dc] of direcciones(p)) {
        const nf = f + df
        const nc = c + dc
        if (dentro(nf, nc) && t[nf][nc] === null) simples.push({ desde: [f, c], camino: [[nf, nc]], capturas: [] })
      }
    }
  }
  return capturas.length > 0 ? capturas : simples // comer es obligatorio
}

export function aplicarMovimiento(t: Tablero, m: Movimiento): Tablero {
  const copia = t.map((fila) => [...fila])
  const [f0, c0] = m.desde
  const pieza = copia[f0][c0] as Pieza
  copia[f0][c0] = null
  for (const [f, c] of m.capturas) copia[f][c] = null
  const [ff, fc] = m.camino[m.camino.length - 1]
  copia[ff][fc] = ff === filaDeCorona(pieza.bando) ? { ...pieza, dama: true } : pieza
  return copia
}

export function contar(t: Tablero, bando: Bando): number {
  return t.flat().filter((p) => p?.bando === bando).length
}

function evaluar(t: Tablero): number {
  // positivo = bien para las negras (bot)
  let v = 0
  for (const fila of t) {
    for (const p of fila) {
      if (!p) continue
      const valor = p.dama ? 3 : 1
      v += p.bando === 'negra' ? valor : -valor
    }
  }
  return v
}

function minimax(t: Tablero, profundidad: number, turno: Bando, alfa: number, beta: number): number {
  const movs = movimientosValidos(t, turno)
  if (movs.length === 0) return turno === 'negra' ? -100 - profundidad : 100 + profundidad
  if (profundidad === 0) return evaluar(t)
  if (turno === 'negra') {
    let mejor = -Infinity
    for (const m of movs) {
      mejor = Math.max(mejor, minimax(aplicarMovimiento(t, m), profundidad - 1, 'blanca', alfa, beta))
      alfa = Math.max(alfa, mejor)
      if (beta <= alfa) break
    }
    return mejor
  }
  let mejor = Infinity
  for (const m of movs) {
    mejor = Math.min(mejor, minimax(aplicarMovimiento(t, m), profundidad - 1, 'negra', alfa, beta))
    beta = Math.min(beta, mejor)
    if (beta <= alfa) break
  }
  return mejor
}

// El bot mira 3 jugadas hacia adelante; entre las mejores elige una al azar para no repetirse
export function elegirMovimientoBot(t: Tablero, azar: () => number = Math.random): Movimiento | null {
  const movs = movimientosValidos(t, 'negra')
  if (movs.length === 0) return null
  const puntuados = movs.map((m) => ({ m, v: minimax(aplicarMovimiento(t, m), 2, 'blanca', -Infinity, Infinity) }))
  const mejor = Math.max(...puntuados.map((x) => x.v))
  const empatados = puntuados.filter((x) => x.v === mejor)
  return empatados[Math.floor(azar() * empatados.length)].m
}
