// Motor de ajedrez: tablero, jugadas legales (enroque, al paso, coronación), jaque mate y tablas.
// Casillas numeradas como en el FEN: 0 = a8, 7 = h8, 56 = a1, 63 = h1. Mayúsculas = blancas, minúsculas = negras.

export type Color = 'w' | 'b'

export interface Estado {
  t: string[] // 64 casillas, '' = vacía
  turno: Color
  enroque: string // derechos que quedan: K Q k q
  alPaso: number // casilla donde se puede capturar al paso, -1 si no hay
  medio: number // medias jugadas desde la última captura o movimiento de peón
  numero: number
}

export interface Mov {
  desde: number
  hasta: number
  promo?: string // 'q' | 'r' | 'b' | 'n'
  enroque?: boolean
  alPaso?: boolean
}

export const FEN_INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const colorDe = (p: string): Color => (p === p.toUpperCase() ? 'w' : 'b')
export const nombreCasilla = (i: number) => 'abcdefgh'[i & 7] + (8 - (i >> 3))
export const aUCI = (m: Mov) => nombreCasilla(m.desde) + nombreCasilla(m.hasta) + (m.promo ?? '')

export function desdeFEN(fen: string): Estado {
  const [piezas, turno, enroque, paso, medio, numero] = fen.split(' ')
  const t: string[] = []
  for (const ch of piezas) {
    if (ch === '/') continue
    if (/\d/.test(ch)) for (let i = 0; i < Number(ch); i++) t.push('')
    else t.push(ch)
  }
  return {
    t,
    turno: turno === 'b' ? 'b' : 'w',
    enroque: enroque === '-' ? '' : enroque,
    alPaso: paso && paso !== '-' ? (8 - Number(paso[1])) * 8 + 'abcdefgh'.indexOf(paso[0]) : -1,
    medio: Number(medio ?? 0),
    numero: Number(numero ?? 1),
  }
}

export function aFEN(e: Estado): string {
  const filas: string[] = []
  for (let r = 0; r < 8; r++) {
    let fila = ''
    let vacias = 0
    for (let c = 0; c < 8; c++) {
      const p = e.t[r * 8 + c]
      if (!p) vacias++
      else {
        if (vacias) fila += vacias
        vacias = 0
        fila += p
      }
    }
    if (vacias) fila += vacias
    filas.push(fila)
  }
  return `${filas.join('/')} ${e.turno} ${e.enroque || '-'} ${e.alPaso >= 0 ? nombreCasilla(e.alPaso) : '-'} ${e.medio} ${e.numero}`
}

export const estadoInicial = () => desdeFEN(FEN_INICIAL)

const CABALLO = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
const REY = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
const RECTA = [[-1, 0], [1, 0], [0, -1], [0, 1]]

// ¿La casilla está atacada por alguna pieza del bando "por"?
export function atacada(t: string[], sq: number, por: Color): boolean {
  const r = sq >> 3
  const c = sq & 7
  const es = (f: number, col: number, piezas: string) => {
    if (f < 0 || f > 7 || col < 0 || col > 7) return false
    const p = t[f * 8 + col]
    return p !== '' && colorDe(p) === por && piezas.includes(p.toLowerCase())
  }
  const filaPeon = por === 'w' ? r + 1 : r - 1
  if (es(filaPeon, c - 1, 'p') || es(filaPeon, c + 1, 'p')) return true
  for (const [df, dc] of CABALLO) if (es(r + df, c + dc, 'n')) return true
  for (const [df, dc] of REY) if (es(r + df, c + dc, 'k')) return true
  for (const [dirs, piezas] of [[DIAG, 'bq'], [RECTA, 'rq']] as const) {
    for (const [df, dc] of dirs) {
      let f = r + df
      let col = c + dc
      while (f >= 0 && f < 8 && col >= 0 && col < 8) {
        const p = t[f * 8 + col]
        if (p) {
          if (colorDe(p) === por && piezas.includes(p.toLowerCase())) return true
          break
        }
        f += df
        col += dc
      }
    }
  }
  return false
}

function pseudoJugadas(e: Estado): Mov[] {
  const movs: Mov[] = []
  const yo = e.turno
  const rival: Color = yo === 'w' ? 'b' : 'w'
  for (let sq = 0; sq < 64; sq++) {
    const p = e.t[sq]
    if (!p || colorDe(p) !== yo) continue
    const r = sq >> 3
    const c = sq & 7
    const tipo = p.toLowerCase()
    if (tipo === 'p') {
      const dir = yo === 'w' ? -1 : 1
      const inicio = yo === 'w' ? 6 : 1
      const coronacion = yo === 'w' ? 0 : 7
      const agregar = (hasta: number, extra: Partial<Mov> = {}) => {
        if (hasta >> 3 === coronacion) for (const promo of ['q', 'r', 'b', 'n']) movs.push({ desde: sq, hasta, promo })
        else movs.push({ desde: sq, hasta, ...extra })
      }
      const uno = sq + dir * 8
      if (uno >= 0 && uno < 64 && !e.t[uno]) {
        agregar(uno)
        if (r === inicio && !e.t[uno + dir * 8]) movs.push({ desde: sq, hasta: uno + dir * 8 })
      }
      for (const dc of [-1, 1]) {
        if (c + dc < 0 || c + dc > 7) continue
        const hasta = sq + dir * 8 + dc
        if (hasta < 0 || hasta > 63) continue
        if (e.t[hasta] && colorDe(e.t[hasta]) === rival) agregar(hasta)
        else if (hasta === e.alPaso) movs.push({ desde: sq, hasta, alPaso: true })
      }
    } else if (tipo === 'n' || tipo === 'k') {
      for (const [df, dc] of tipo === 'n' ? CABALLO : REY) {
        const f = r + df
        const col = c + dc
        if (f < 0 || f > 7 || col < 0 || col > 7) continue
        const hasta = f * 8 + col
        if (!e.t[hasta] || colorDe(e.t[hasta]) === rival) movs.push({ desde: sq, hasta })
      }
    } else {
      const dirs = tipo === 'b' ? DIAG : tipo === 'r' ? RECTA : [...DIAG, ...RECTA]
      for (const [df, dc] of dirs) {
        let f = r + df
        let col = c + dc
        while (f >= 0 && f < 8 && col >= 0 && col < 8) {
          const hasta = f * 8 + col
          if (!e.t[hasta]) movs.push({ desde: sq, hasta })
          else {
            if (colorDe(e.t[hasta]) === rival) movs.push({ desde: sq, hasta })
            break
          }
          f += df
          col += dc
        }
      }
    }
  }
  // Enroque: derechos vigentes, camino libre y el rey no pasa por casillas atacadas
  const base = yo === 'w' ? 56 : 0
  const rey = yo === 'w' ? 'K' : 'k'
  const torre = yo === 'w' ? 'R' : 'r'
  if (e.t[base + 4] === rey && !atacada(e.t, base + 4, rival)) {
    const corto = yo === 'w' ? 'K' : 'k'
    const largo = yo === 'w' ? 'Q' : 'q'
    if (e.enroque.includes(corto) && e.t[base + 7] === torre && !e.t[base + 5] && !e.t[base + 6] && !atacada(e.t, base + 5, rival) && !atacada(e.t, base + 6, rival)) {
      movs.push({ desde: base + 4, hasta: base + 6, enroque: true })
    }
    if (e.enroque.includes(largo) && e.t[base] === torre && !e.t[base + 1] && !e.t[base + 2] && !e.t[base + 3] && !atacada(e.t, base + 3, rival) && !atacada(e.t, base + 2, rival)) {
      movs.push({ desde: base + 4, hasta: base + 2, enroque: true })
    }
  }
  return movs
}

export function aplicar(e: Estado, m: Mov): Estado {
  const t = [...e.t]
  const p = t[m.desde]
  const yo = colorDe(p)
  const esPeon = p.toLowerCase() === 'p'
  const captura = t[m.hasta] !== '' || !!m.alPaso
  t[m.desde] = ''
  if (m.alPaso) t[m.hasta + (yo === 'w' ? 8 : -8)] = ''
  t[m.hasta] = m.promo ? (yo === 'w' ? m.promo.toUpperCase() : m.promo) : p
  if (m.enroque) {
    if (m.hasta === 62) [t[61], t[63]] = [t[63], '']
    else if (m.hasta === 58) [t[59], t[56]] = [t[56], '']
    else if (m.hasta === 6) [t[5], t[7]] = [t[7], '']
    else if (m.hasta === 2) [t[3], t[0]] = [t[0], '']
  }
  let enroque = e.enroque
  const quitar = (letras: string) => {
    for (const l of letras) enroque = enroque.replace(l, '')
  }
  if (p === 'K') quitar('KQ')
  if (p === 'k') quitar('kq')
  for (const casilla of [m.desde, m.hasta]) {
    if (casilla === 63) quitar('K')
    if (casilla === 56) quitar('Q')
    if (casilla === 7) quitar('k')
    if (casilla === 0) quitar('q')
  }
  return {
    t,
    turno: yo === 'w' ? 'b' : 'w',
    enroque,
    alPaso: esPeon && Math.abs(m.hasta - m.desde) === 16 ? (m.desde + m.hasta) / 2 : -1,
    medio: esPeon || captura ? 0 : e.medio + 1,
    numero: yo === 'b' ? e.numero + 1 : e.numero,
  }
}

export function enJaque(e: Estado, color: Color = e.turno): boolean {
  const rey = e.t.indexOf(color === 'w' ? 'K' : 'k')
  return rey >= 0 && atacada(e.t, rey, color === 'w' ? 'b' : 'w')
}

export function jugadasLegales(e: Estado): Mov[] {
  return pseudoJugadas(e).filter((m) => !enJaque(aplicar(e, m), e.turno))
}

export type Resultado = 'jaquemate' | 'ahogado' | 'cincuenta' | 'material' | null

export function resultado(e: Estado): Resultado {
  if (jugadasLegales(e).length === 0) return enJaque(e) ? 'jaquemate' : 'ahogado'
  if (e.medio >= 100) return 'cincuenta'
  const piezas = e.t.filter((p) => p && p.toLowerCase() !== 'k')
  if (piezas.length === 0) return 'material'
  if (piezas.length === 1 && 'bn'.includes(piezas[0].toLowerCase())) return 'material'
  return null
}

// ---- Bot local (se usa si la IA no está disponible): búsqueda de 3 jugadas con poda alfa-beta ----

const VALOR: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

function evaluar(e: Estado): number {
  // positivo = mejor para las blancas
  let v = 0
  for (let sq = 0; sq < 64; sq++) {
    const p = e.t[sq]
    if (!p) continue
    const tipo = p.toLowerCase()
    const f = sq >> 3
    const c = sq & 7
    const centro = 3 - Math.max(Math.abs(f - 3.5) - 0.5, Math.abs(c - 3.5) - 0.5) // 3 en el centro, 0 en el borde
    let valor = VALOR[tipo] + (tipo === 'n' || tipo === 'b' || tipo === 'p' ? centro * 6 : 0)
    if (tipo === 'p') valor += (colorDe(p) === 'w' ? 6 - f : f - 1) * 4 // los peones valen más al avanzar
    v += colorDe(p) === 'w' ? valor : -valor
  }
  return v
}

function buscar(e: Estado, prof: number, alfa: number, beta: number): number {
  const legales = jugadasLegales(e)
  if (legales.length === 0) return enJaque(e) ? (e.turno === 'w' ? -100000 - prof : 100000 + prof) : 0
  if (prof === 0) return evaluar(e)
  // primero las capturas: la poda corta mucho más
  legales.sort((a, b) => Number(!!e.t[b.hasta]) - Number(!!e.t[a.hasta]))
  if (e.turno === 'w') {
    let mejor = -Infinity
    for (const m of legales) {
      mejor = Math.max(mejor, buscar(aplicar(e, m), prof - 1, alfa, beta))
      alfa = Math.max(alfa, mejor)
      if (beta <= alfa) break
    }
    return mejor
  }
  let mejor = Infinity
  for (const m of legales) {
    mejor = Math.min(mejor, buscar(aplicar(e, m), prof - 1, alfa, beta))
    beta = Math.min(beta, mejor)
    if (beta <= alfa) break
  }
  return mejor
}

export function mejorJugadaLocal(e: Estado, azar: () => number = Math.random, profundidad = 3): Mov | null {
  const legales = jugadasLegales(e)
  if (legales.length === 0) return null
  const signo = e.turno === 'w' ? 1 : -1
  const puntuadas = legales.map((m) => ({ m, v: signo * buscar(aplicar(e, m), profundidad - 1, -Infinity, Infinity) + azar() * 2 }))
  return puntuadas.reduce((a, b) => (b.v > a.v ? b : a)).m
}
