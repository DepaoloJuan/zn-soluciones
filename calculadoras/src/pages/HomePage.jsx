import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 relative">
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-[radial-gradient(circle,rgba(29,185,84,0.06)_0%,transparent_70%)] pointer-events-none" />

      <p className="relative font-mono text-xs tracking-[4px] uppercase text-nz-green mb-4">
        NZ Soluciones
      </p>
      <h1 className="relative text-[clamp(32px,5vw,48px)] font-extrabold tracking-tight mb-3">
        Calculadoras de materiales
      </h1>
      <p className="relative text-nz-text2 text-base max-w-[460px] leading-relaxed mb-12">
        Calculá la cantidad exacta de materiales y armá tu presupuesto al instante para tu obra en seco.
      </p>

      <div className="relative flex gap-4 flex-wrap justify-center">
        <Link
          to="/cielorraso"
          className="bg-nz-surface border border-nz-border rounded-xl p-8 w-[220px] no-underline text-nz-text text-center transition-all hover:border-nz-green hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(29,185,84,0.1)] group"
        >
          <div className="text-[40px] mb-4">📐</div>
          <h3 className="text-lg font-bold mb-1 group-hover:text-nz-green transition-colors">Cielorraso</h3>
          <p className="text-xs text-nz-text2">Placa simple</p>
        </Link>

        <div className="bg-nz-surface border border-nz-border rounded-xl p-8 w-[220px] text-center opacity-45">
          <div className="text-[40px] mb-4">🧱</div>
          <h3 className="text-lg font-bold mb-1">Tabique</h3>
          <p className="text-xs text-nz-text2">Placa simple</p>
          <span className="block mt-3 font-mono text-[10px] tracking-[1px] uppercase text-nz-green">
            Próximamente
          </span>
        </div>
      </div>
    </div>
  )
}
