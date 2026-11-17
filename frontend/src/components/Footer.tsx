import SectionTitle from '@/components/SectionTitle'

function Footer() {
  return (
    <footer id="contacto" className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        <SectionTitle numero="04" titulo="Contacto" derecha="Arequipa · Perú" />

        <h2 className="font-display text-5xl uppercase leading-[0.95] sm:text-7xl">
          Tu próxima partida
          <br />
          empieza aquí<span className="text-hot">.</span>
        </h2>

        <div className="flex flex-col gap-2 border-t border-paper/20 pt-6 text-sm text-paper/60 sm:flex-row sm:justify-between">
          <p>
            <span className="font-bold text-paper">Gambito</span> · Tienda de juegos de mesa
          </p>
          <p>Proyecto de laboratorio · TECSUP · Tecnologías Emergentes</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
