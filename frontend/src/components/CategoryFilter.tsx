import { Button } from '@/components/ui/button'

interface CategoryFilterProps {
  categorias: string[]
  categoriaSeleccionada: string
  conteos: Record<string, number>
  onSeleccionar: (categoria: string) => void
}

function CategoryFilter({
  categorias,
  categoriaSeleccionada,
  conteos,
  onSeleccionar,
}: CategoryFilterProps) {
  const opciones = ['Todos', ...categorias]

  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((categoria) => {
        const activa = categoria === categoriaSeleccionada
        return (
          <Button
            key={categoria}
            variant="outline"
            onClick={() => onSeleccionar(categoria)}
            className={`h-9 rounded-none border-ink px-4 text-xs font-bold uppercase tracking-widest ${
              activa
                ? 'bg-ink text-paper hover:bg-ink hover:text-paper'
                : 'bg-transparent text-ink hover:bg-ink/10'
            }`}
          >
            {categoria}
            <span className={activa ? 'text-hot' : 'text-ink/50'}>{conteos[categoria] ?? 0}</span>
          </Button>
        )
      })}
    </div>
  )
}

export default CategoryFilter
