import { Link } from 'react-router-dom'

export default function TabiquePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 relative">
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(29,185,84,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative text-6xl mb-6 opacity-50">🧱</div>
      <h1 className="relative text-[clamp(28px,5vw,42px)] font-extrabold tracking-tight mb-3">
        Calculadora de Tabique
      </h1>
      <p className="relative text-nz-text2 text-base max-w-[420px] leading-relaxed mb-8">
        Estamos armando la calculadora de materiales para tabiques. Próximamente vas a poder calcular todo lo que necesitás para tus paredes en seco.
      </p>
      <div className="relative inline-flex items-center gap-2 bg-nz-green-glow border border-nz-green/20 rounded-full px-6 py-2.5 font-mono text-xs tracking-[2px] uppercase text-nz-green">
        Próximamente
      </div>
      <Link
        to="/cielorraso"
        className="relative mt-6 text-nz-text2 no-underline text-sm hover:text-nz-green transition-colors"
      >
        ← Ir a Calculadora Cielorraso
      </Link>
    </div>
  )
}
