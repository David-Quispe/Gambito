interface SectionTitleProps {
  numero: string
  titulo: string
  derecha?: string
}

function SectionTitle({ numero, titulo, derecha }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-display text-xl tracking-wide">{numero}.</span>
      <h2 className="text-sm font-bold uppercase tracking-[0.25em]">{titulo}</h2>
      <span className="h-px flex-1 bg-current opacity-30" />
      {derecha && (
        <span className="hidden text-xs uppercase tracking-[0.2em] opacity-60 sm:block">
          {derecha}
        </span>
      )}
    </div>
  )
}

export default SectionTitle
