import { Button } from '@/components/ui/button'

export function Cargando() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-32 text-center" role="status">
      <div className="size-12 animate-spin rounded-full border-4 border-ink/20 border-t-hot" />
      <p className="font-display text-2xl uppercase tracking-wide">Cargando juegos...</p>
      <p className="text-sm text-muted-foreground">Estamos pidiendo el catálogo al servidor.</p>
    </div>
  )
}

interface ErrorCargaProps {
  mensaje: string
  onReintentar: () => void
}

export function ErrorCarga({ mensaje, onReintentar }: ErrorCargaProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-32 text-center" role="alert">
      <p className="font-display text-3xl uppercase tracking-wide">No pudimos cargar el catálogo</p>
      <p className="text-sm text-muted-foreground">
        Revisa que el servidor de Django esté encendido en http://127.0.0.1:8000 e inténtalo de
        nuevo.
      </p>
      <p className="text-xs text-muted-foreground/80">Detalle: {mensaje}</p>
      <Button onClick={onReintentar} className="rounded-full px-6 text-xs font-bold uppercase tracking-widest">
        Reintentar
      </Button>
    </div>
  )
}
