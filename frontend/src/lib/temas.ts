// Colores de cada categoría: se usan en las tarjetas y en las secciones.
export interface TemaCategoria {
  fondo: string
  titulo: string
  acento: string
  acentoTexto: string
}

const temas: Record<string, TemaCategoria> = {
  Estrategia: {
    fondo: 'radial-gradient(circle at 20% 0%, #9a3a6a 0%, #5a1a3f 75%)',
    titulo: '#fbeedd',
    acento: '#f6c9d6',
    acentoTexto: '#4a1432',
  },
  Familiares: {
    fondo: 'radial-gradient(circle at 20% 0%, #2f9a63 0%, #124f33 75%)',
    titulo: '#f6e7b4',
    acento: '#7ee0a3',
    acentoTexto: '#0d3a24',
  },
  Cartas: {
    fondo: 'radial-gradient(circle at 20% 0%, #d4568f 0%, #8f2358 75%)',
    titulo: '#fff3f6',
    acento: '#ffd0e0',
    acentoTexto: '#6a1740',
  },
  Party: {
    fondo: 'radial-gradient(circle at 20% 0%, #25397a 0%, #0c1633 75%)',
    titulo: '#f2c230',
    acento: '#f2c230',
    acentoTexto: '#13204a',
  },
  Cooperativos: {
    fondo: 'radial-gradient(circle at 20% 0%, #2a8a86 0%, #0f3d3f 75%)',
    titulo: '#fdebd0',
    acento: '#f4b68c',
    acentoTexto: '#17383a',
  },
}

const temaPorDefecto: TemaCategoria = {
  fondo: 'radial-gradient(circle at 20% 0%, #3a4060 0%, #151826 75%)',
  titulo: '#f4f1e8',
  acento: '#f4b68c',
  acentoTexto: '#151826',
}

export function obtenerTema(categoria: string): TemaCategoria {
  return temas[categoria] ?? temaPorDefecto
}
