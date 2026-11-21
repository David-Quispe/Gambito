import { useEffect, useState } from 'react'
import { useCarrito } from '@/lib/carrito'
import { crearPedido, ErrorApi } from '@/services/api'
import type { Faltante, MetodoPago, Pedido } from '@/types/pedido'
import type { Usuario } from '@/types/producto'

interface CheckoutProps {
  usuario: Usuario
  onCerrar: () => void
  onCompraHecha: () => void
  onVerPedidos: () => void
}

const campo =
  'h-11 w-full border border-ink bg-transparent px-3 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:ring-2 focus:ring-hot'

const METODOS: { id: MetodoPago; titulo: string; detalle: string }[] = [
  { id: 'tarjeta', titulo: 'Tarjeta', detalle: 'Pago simulado' },
  { id: 'yape', titulo: 'Yape', detalle: 'Pago simulado' },
  { id: 'contraentrega', titulo: 'Contra entrega', detalle: 'Pagas al recibir' },
]

// Agrupa los dígitos de 4 en 4: 4242 4242 4242 4242
const formatearTarjeta = (texto: string) =>
  texto.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')

// Pantalla de pago. El pago es una simulación: del número de tarjeta solo viajan
// los 4 últimos dígitos y no se guarda nada más.
function Checkout({ usuario, onCerrar, onCompraHecha, onVerPedidos }: CheckoutProps) {
  const { items, total, vaciar, ajustarAStock } = useCarrito()
  const [nombre, setNombre] = useState(usuario.username)
  const [direccion, setDireccion] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('yape')
  const [tarjeta, setTarjeta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [pedido, setPedido] = useState<Pedido | null>(null)

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alPulsar)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = anterior
    }
  }, [onCerrar])

  async function pagar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const nuevos: Record<string, string> = {}
    if (nombre.trim().length < 3) nuevos.nombre = 'Escribe tu nombre completo.'
    if (direccion.trim().length < 8) nuevos.direccion = 'Escribe una dirección de entrega completa.'
    const digitos = tarjeta.replace(/\D/g, '')
    if (metodo === 'tarjeta' && digitos.length < 13) nuevos.tarjeta = 'Escribe el número de la tarjeta de prueba.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      const creado = await crearPedido({
        items: items.map((i) => ({ producto: i.id, cantidad: i.cantidad })),
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        metodo,
        tarjeta_final: metodo === 'tarjeta' ? digitos.slice(-4) : undefined,
      })
      vaciar()
      setPedido(creado)
      onCompraHecha()
    } catch (err) {
      if (err instanceof ErrorApi && err.estado === 409 && Array.isArray(err.cuerpo.faltantes)) {
        ajustarAStock(err.cuerpo.faltantes as Faltante[])
      }
      setError(
        err instanceof TypeError
          ? 'No pudimos conectar con el servidor. Revisa que Django esté encendido.'
          : err instanceof Error
            ? err.message
            : 'No se pudo completar la compra.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onCerrar} role="dialog" aria-modal="true" aria-label="Pagar">
      <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto bg-paper text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-ink px-5 py-4 text-paper">
          <p className="font-display text-3xl uppercase leading-none tracking-wide">
            {pedido ? 'Listo' : 'Pagar'}
            <span className="text-hot">.</span>
          </p>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="size-9 border border-paper/40 text-lg hover:bg-paper/10">
            ✕
          </button>
        </div>

        {pedido ? (
          <div className="space-y-4 p-6">
            <p className="font-serif text-3xl font-bold uppercase leading-tight">¡Gracias por tu compra, {pedido.nombre_cliente.split(' ')[0]}!</p>
            <p className="text-sm">
              Tu pedido <strong>#{pedido.id}</strong> quedó registrado ({pedido.estado_nombre.toLowerCase()}). Lo enviaremos a{' '}
              <strong>{pedido.direccion}</strong>.
            </p>
            <ul className="divide-y divide-ink/15 border-y border-ink/15 text-sm">
              {pedido.items.map((item) => (
                <li key={item.nombre} className="flex justify-between gap-3 py-2">
                  <span>
                    {item.cantidad} × {item.nombre}
                  </span>
                  <span className="font-bold">S/ {item.subtotal.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="flex items-end justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{pedido.referencia_pago}</span>
              <span className="font-display text-4xl leading-none">S/ {pedido.total.toFixed(2)}</span>
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={onVerPedidos} className="h-11 bg-ink px-5 text-xs font-bold uppercase tracking-widest text-paper hover:bg-hot">
                Ver mis pedidos
              </button>
              <button type="button" onClick={onCerrar} className="h-11 border border-ink px-5 text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-paper">
                Seguir comprando
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={pagar} className="space-y-4 p-5" noValidate>
            <ul className="divide-y divide-ink/15 border-y border-ink/15 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {item.cantidad} × {item.nombre}
                  </span>
                  <span className="font-bold">S/ {(item.precio_final * item.cantidad).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <label className="block space-y-1 text-xs font-semibold uppercase tracking-widest">
              Nombre de quien recibe
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" className={campo} />
              {errores.nombre && <span className="block text-[11px] font-normal normal-case tracking-normal text-red-700">{errores.nombre}</span>}
            </label>

            <label className="block space-y-1 text-xs font-semibold uppercase tracking-widest">
              Dirección de entrega
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} autoComplete="street-address" placeholder="Calle, número, distrito" className={campo} />
              {errores.direccion && <span className="block text-[11px] font-normal normal-case tracking-normal text-red-700">{errores.direccion}</span>}
            </label>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-widest">Cómo quieres pagar</legend>
              <div className="grid grid-cols-3 gap-2">
                {METODOS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetodo(m.id)}
                    aria-pressed={metodo === m.id}
                    className={`border px-2 py-2 text-center transition ${
                      metodo === m.id ? 'border-ink bg-ink text-paper' : 'border-ink/40 hover:border-ink'
                    }`}
                  >
                    <span className="block text-xs font-bold uppercase tracking-wider">{m.titulo}</span>
                    <span className="block text-[10px] opacity-70">{m.detalle}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {metodo === 'tarjeta' && (
              <label className="block space-y-1 text-xs font-semibold uppercase tracking-widest">
                Número de tarjeta de prueba
                <input
                  value={tarjeta}
                  onChange={(e) => setTarjeta(formatearTarjeta(e.target.value))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="4242 4242 4242 4242"
                  className={campo}
                />
                {errores.tarjeta && <span className="block text-[11px] font-normal normal-case tracking-normal text-red-700">{errores.tarjeta}</span>}
                <span className="block text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                  Es una simulación, no uses una tarjeta real. 4242 4242 4242 4242 se aprueba y 4000 0000 0000 0002 se rechaza.
                </span>
              </label>
            )}
            {metodo === 'yape' && (
              <p className="border border-ink/20 bg-card px-3 py-2 text-xs">Se aprobará un pago de Yape simulado al confirmar.</p>
            )}
            {metodo === 'contraentrega' && (
              <p className="border border-ink/20 bg-card px-3 py-2 text-xs">El pedido queda pendiente y pagas al recibirlo.</p>
            )}

            {error && (
              <p role="alert" className="border border-hot bg-hot/10 px-3 py-2 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || items.length === 0}
              className="h-12 w-full bg-ink text-sm font-bold uppercase tracking-widest text-paper transition hover:bg-hot disabled:opacity-60"
            >
              {enviando ? 'Procesando pago...' : `Confirmar y pagar S/ ${total.toFixed(2)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Checkout
