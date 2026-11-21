// Uno simplificado para dos jugadores: tú contra el bot.
// Cartas: números 0-9, "salta", "+2" en cuatro colores, más comodines y "+4".
// Con dos jugadores, salta y +2 hacen que el rival pierda el turno.

export type ColorUno = 'rojo' | 'amarillo' | 'verde' | 'azul'
export type ValorUno = number | 'salta' | '+2' | 'comodin' | '+4'

export interface CartaUno {
  id: number
  color: ColorUno | null // null = comodín
  valor: ValorUno
}

export type Jugador = 'jugador' | 'bot'

export interface PartidaUno {
  jugador: CartaUno[]
  bot: CartaUno[]
  mazo: CartaUno[]
  descarte: CartaUno[]
  color: ColorUno // color que se debe jugar ahora
  turno: Jugador
  ganador: Jugador | null
  mensaje: string
}

export const COLORES: ColorUno[] = ['rojo', 'amarillo', 'verde', 'azul']

export function crearMazo(): CartaUno[] {
  const cartas: CartaUno[] = []
  let id = 0
  for (const color of COLORES) {
    cartas.push({ id: id++, color, valor: 0 })
    for (let n = 1; n <= 9; n++) {
      cartas.push({ id: id++, color, valor: n }, { id: id++, color, valor: n })
    }
    for (const valor of ['salta', '+2'] as const) {
      cartas.push({ id: id++, color, valor }, { id: id++, color, valor })
    }
  }
  for (let i = 0; i < 4; i++) {
    cartas.push({ id: id++, color: null, valor: 'comodin' }, { id: id++, color: null, valor: '+4' })
  }
  return cartas
}

export function mezclar<T>(lista: T[], azar: () => number = Math.random): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

export function nuevaPartida(azar: () => number = Math.random): PartidaUno {
  const mazo = mezclar(crearMazo(), azar)
  const jugador = mazo.splice(0, 7)
  const bot = mazo.splice(0, 7)
  // La primera carta de la pila debe ser un número normal
  let indice = mazo.findIndex((c) => c.color !== null && typeof c.valor === 'number')
  if (indice < 0) indice = 0
  const [primera] = mazo.splice(indice, 1)
  return {
    jugador,
    bot,
    mazo,
    descarte: [primera],
    color: primera.color as ColorUno,
    turno: 'jugador',
    ganador: null,
    mensaje: 'Empiezas tú. Juega una carta del mismo color o número.',
  }
}

export function cartaSuperior(p: PartidaUno): CartaUno {
  return p.descarte[p.descarte.length - 1]
}

export function puedeJugar(carta: CartaUno, p: PartidaUno): boolean {
  if (carta.color === null) return true
  if (carta.color === p.color) return true
  return carta.valor === cartaSuperior(p).valor
}

function otro(quien: Jugador): Jugador {
  return quien === 'jugador' ? 'bot' : 'jugador'
}

const nombre = (quien: Jugador) => (quien === 'jugador' ? 'Tú' : 'El bot')

// Saca n cartas del mazo; si se acaba, se rebaraja el descarte (menos la carta de arriba)
function sacar(p: PartidaUno, n: number, azar: () => number): CartaUno[] {
  const sacadas: CartaUno[] = []
  for (let i = 0; i < n; i++) {
    if (p.mazo.length === 0) {
      if (p.descarte.length <= 1) break
      const tope = p.descarte.pop() as CartaUno
      p.mazo = mezclar(p.descarte, azar)
      p.descarte = [tope]
    }
    const c = p.mazo.shift()
    if (c) sacadas.push(c)
  }
  return sacadas
}

function copiar(p: PartidaUno): PartidaUno {
  return { ...p, jugador: [...p.jugador], bot: [...p.bot], mazo: [...p.mazo], descarte: [...p.descarte] }
}

// Juega la carta con ese id. Los comodines necesitan el color elegido.
export function jugarCarta(
  anterior: PartidaUno,
  quien: Jugador,
  idCarta: number,
  colorElegido?: ColorUno,
  azar: () => number = Math.random,
): PartidaUno {
  if (anterior.ganador || anterior.turno !== quien) return anterior
  const mano = quien === 'jugador' ? anterior.jugador : anterior.bot
  const carta = mano.find((c) => c.id === idCarta)
  if (!carta || !puedeJugar(carta, anterior)) return anterior
  if (carta.color === null && !colorElegido) return anterior

  const p = copiar(anterior)
  const nueva = (quien === 'jugador' ? p.jugador : p.bot).filter((c) => c.id !== idCarta)
  if (quien === 'jugador') p.jugador = nueva
  else p.bot = nueva
  p.descarte.push(carta)
  p.color = carta.color ?? (colorElegido as ColorUno)

  const rival = otro(quien)
  let texto = `${nombre(quien)} ${quien === 'jugador' ? 'jugaste' : 'jugó'} ${describir(carta)}`
  let siguiente = rival

  if (carta.valor === 'salta') {
    siguiente = quien
    texto += `. ${nombre(rival)} pierde el turno`
  } else if (carta.valor === '+2' || carta.valor === '+4') {
    const n = carta.valor === '+2' ? 2 : 4
    const robadas = sacar(p, n, azar)
    if (rival === 'jugador') p.jugador = [...p.jugador, ...robadas]
    else p.bot = [...p.bot, ...robadas]
    siguiente = quien
    texto += `. ${nombre(rival)} roba ${robadas.length} y pierde el turno`
  }
  if (carta.color === null) texto += ` (color ${p.color})`

  if (nueva.length === 0) {
    p.ganador = quien
    p.mensaje = quien === 'jugador' ? '¡Ganaste la partida!' : 'El bot se quedó sin cartas. Perdiste.'
    return p
  }
  p.turno = siguiente
  p.mensaje = texto + '.'
  return p
}

// Roba una carta. Si se puede jugar, la partida sigue con el mismo jugador; si no, pasa el turno.
export function robar(anterior: PartidaUno, quien: Jugador, azar: () => number = Math.random): PartidaUno {
  if (anterior.ganador || anterior.turno !== quien) return anterior
  const p = copiar(anterior)
  const [carta] = sacar(p, 1, azar)
  if (!carta) {
    p.turno = otro(quien)
    p.mensaje = `${nombre(quien)} no puede robar: no quedan cartas.`
    return p
  }
  if (quien === 'jugador') p.jugador = [...p.jugador, carta]
  else p.bot = [...p.bot, carta]
  if (puedeJugar(carta, p)) {
    p.mensaje = quien === 'jugador' ? 'Robaste una carta y puedes jugarla (o pasar).' : 'El bot robó una carta.'
  } else {
    p.turno = otro(quien)
    p.mensaje = `${nombre(quien)} ${quien === 'jugador' ? 'robaste' : 'robó'} una carta y pasa el turno.`
  }
  return p
}

export function pasar(anterior: PartidaUno, quien: Jugador): PartidaUno {
  if (anterior.ganador || anterior.turno !== quien) return anterior
  return { ...anterior, turno: otro(quien), mensaje: `${nombre(quien)} ${quien === 'jugador' ? 'pasaste' : 'pasó'} el turno.` }
}

export function describir(c: CartaUno): string {
  if (c.valor === 'comodin') return 'un comodín'
  if (c.valor === '+4') return 'un +4'
  return `${c.valor === 'salta' ? 'salta' : c.valor} ${c.color}`
}

// Decide la jugada del bot: primero cartas de color, comodines solo si no hay otra opción
export function elegirJugadaBot(p: PartidaUno): { carta: CartaUno; color?: ColorUno } | null {
  const jugables = p.bot.filter((c) => puedeJugar(c, p))
  if (jugables.length === 0) return null
  const coloreadas = jugables.filter((c) => c.color !== null)
  const preferidas = coloreadas.filter((c) => typeof c.valor !== 'number') // castigos primero
  const carta = preferidas[0] ?? coloreadas[0] ?? jugables[0]
  if (carta.color !== null) return { carta }
  return { carta, color: colorMasFrecuente(p.bot.filter((c) => c.id !== carta.id)) }
}

export function colorMasFrecuente(mano: CartaUno[]): ColorUno {
  const cuenta: Record<ColorUno, number> = { rojo: 0, amarillo: 0, verde: 0, azul: 0 }
  for (const c of mano) if (c.color) cuenta[c.color]++
  return COLORES.reduce((mejor, c) => (cuenta[c] > cuenta[mejor] ? c : mejor), COLORES[0])
}

// Un paso completo del bot (jugar, o robar y luego jugar/pasar)
export function turnoDelBot(p: PartidaUno, azar: () => number = Math.random): PartidaUno {
  if (p.ganador || p.turno !== 'bot') return p
  const jugada = elegirJugadaBot(p)
  if (jugada) return jugarCarta(p, 'bot', jugada.carta.id, jugada.color, azar)
  const tras = robar(p, 'bot', azar)
  if (tras.turno !== 'bot') return tras
  // la carta robada se puede jugar
  const segunda = elegirJugadaBot(tras)
  return segunda ? jugarCarta(tras, 'bot', segunda.carta.id, segunda.color, azar) : pasar(tras, 'bot')
}
