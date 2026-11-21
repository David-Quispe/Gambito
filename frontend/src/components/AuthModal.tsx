import { useEffect, useState } from 'react'
import { ErrorApi, iniciarSesion, registrarse } from '@/services/api'
import type { Usuario } from '@/types/producto'

export type ModoAuth = 'ingresar' | 'registro'

interface AuthModalProps {
  modoInicial: ModoAuth
  onCerrar: () => void
  onExito: (usuario: Usuario) => void
}

const campo =
  'h-11 w-full border border-ink bg-transparent px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-hot'

function Etiqueta({ texto, error, children }: { texto: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-xs font-semibold uppercase tracking-widest">
      {texto}
      {children}
      {error && <span className="block text-[11px] font-normal normal-case tracking-normal text-red-700">{error}</span>}
    </label>
  )
}

// Ventana para iniciar sesión o crear una cuenta de comprador.
function AuthModal({ modoInicial, onCerrar, onExito }: AuthModalProps) {
  const [modo, setModo] = useState<ModoAuth>(modoInicial)
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [clave2, setClave2] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

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

  function cambiarModo(nuevo: ModoAuth) {
    setModo(nuevo)
    setErrorGeneral(null)
    setErrores({})
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErrorGeneral(null)
    setErrores({})

    if (modo === 'registro' && clave !== clave2) {
      setErrores({ clave2: 'Las contraseñas no coinciden.' })
      return
    }

    setEnviando(true)
    try {
      const datos =
        modo === 'ingresar'
          ? await iniciarSesion(usuario, clave)
          : await registrarse(usuario, correo, clave)
      onExito(datos)
    } catch (err) {
      if (err instanceof ErrorApi && Object.keys(err.campos).length > 0) {
        const nuevos: Record<string, string> = {}
        for (const [nombre, mensajes] of Object.entries(err.campos)) {
          nuevos[nombre] = Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes)
        }
        setErrores(nuevos)
      } else {
        setErrorGeneral(
          err instanceof TypeError
            ? 'No pudimos conectar con el servidor. Revisa que Django esté encendido.'
            : err instanceof Error
              ? err.message
              : 'Ocurrió un error inesperado.',
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  const esRegistro = modo === 'registro'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
    >
      <div
        className="max-h-[94vh] w-full max-w-md overflow-y-auto bg-paper text-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-ink px-5 py-4 text-paper">
          <p className="font-display text-3xl uppercase leading-none tracking-wide">
            {esRegistro ? 'Crear cuenta' : 'Ingresar'}
            <span className="text-hot">.</span>
          </p>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="size-9 border border-paper/40 text-lg hover:bg-paper/10">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 border-b border-ink/20 text-xs font-bold uppercase tracking-widest">
          {(['ingresar', 'registro'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => cambiarModo(m)}
              className={`py-3 transition ${modo === m ? 'border-b-2 border-hot text-ink' : 'text-ink/50 hover:text-ink'}`}
            >
              {m === 'ingresar' ? 'Ya tengo cuenta' : 'Soy nuevo'}
            </button>
          ))}
        </div>

        <form onSubmit={enviar} className="space-y-4 p-5" noValidate>
          <Etiqueta texto={esRegistro ? 'Nombre de usuario' : 'Usuario o correo'} error={errores.username ?? errores.identificador}>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
              className={`${campo} font-normal normal-case tracking-normal`}
              placeholder={esRegistro ? 'ej: david_games' : 'tu usuario o tu correo'}
            />
          </Etiqueta>

          {esRegistro && (
            <Etiqueta texto="Correo" error={errores.email}>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
                required
                className={`${campo} font-normal normal-case tracking-normal`}
                placeholder="tucorreo@ejemplo.com"
              />
            </Etiqueta>
          )}

          <Etiqueta texto="Contraseña" error={errores.password}>
            <div className="flex">
              <input
                type={verClave ? 'text' : 'password'}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
                required
                className={`${campo} font-normal normal-case tracking-normal`}
                placeholder={esRegistro ? 'mínimo 8 caracteres' : 'tu contraseña'}
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                className="h-11 shrink-0 border border-l-0 border-ink px-3 text-[11px] font-bold uppercase tracking-wider hover:bg-ink hover:text-paper"
              >
                {verClave ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </Etiqueta>

          {esRegistro && (
            <Etiqueta texto="Repite la contraseña" error={errores.clave2}>
              <input
                type={verClave ? 'text' : 'password'}
                value={clave2}
                onChange={(e) => setClave2(e.target.value)}
                autoComplete="new-password"
                required
                className={`${campo} font-normal normal-case tracking-normal`}
              />
            </Etiqueta>
          )}

          {errorGeneral && (
            <p role="alert" className="border border-hot bg-hot/10 px-3 py-2 text-sm">
              {errorGeneral}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="h-11 w-full bg-ink text-xs font-bold uppercase tracking-widest text-paper transition hover:bg-hot disabled:opacity-60"
          >
            {enviando ? 'Un momento...' : esRegistro ? 'Crear mi cuenta' : 'Ingresar'}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {esRegistro
              ? 'Las cuentas nuevas son de comprador. El acceso de administrador lo asigna la tienda.'
              : 'Si eres administrador, ingresa con tu usuario o correo de administrador.'}
          </p>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
