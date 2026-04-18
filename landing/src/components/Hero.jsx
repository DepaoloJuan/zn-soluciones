import WhatsAppIcon from './WhatsAppIcon'

const WA_LINK = 'https://wa.me/5491166582889?text=Hola%2C%20quiero%20pedir%20un%20presupuesto'

export default function Hero() {
  return (
    <section id="inicio" className="min-h-screen flex items-center justify-center text-center px-6 pt-32 pb-20 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(29,185,84,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Diagonal lines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_60px,rgba(29,185,84,0.02)_60px,rgba(29,185,84,0.02)_61px)] pointer-events-none" />

      <div className="relative z-10 max-w-[700px]">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-nz-green-glow border border-nz-green/20 rounded-full px-5 py-2 text-[13px] font-semibold text-nz-green mb-8 animate-[fade-down_0.6s_ease_both]">
          <span className="w-2 h-2 bg-nz-green rounded-full animate-[pulse-dot_2s_ease_infinite]" />
          Presupuesto sin cargo
        </div>

        {/* Title */}
        <h1 className="text-[clamp(40px,7vw,72px)] font-black leading-[1.05] tracking-[-2px] mb-6 animate-[fade-up_0.7s_ease_both_0.1s]">
          Hacemos que{' '}
          <span className="bg-gradient-to-br from-nz-green to-[#4ade80] bg-clip-text text-transparent">
            funcione
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-nz-text2 leading-relaxed max-w-[520px] mx-auto mb-10 animate-[fade-up_0.7s_ease_both_0.2s]">
          Construcción en seco, remodelaciones integrales, instalaciones eléctricas, plomería y más. Soluciones completas para tu obra.
        </p>

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap animate-[fade-up_0.7s_ease_both_0.3s]">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-nz-green text-nz-bg font-semibold text-[15px] no-underline shadow-[0_4px_24px_rgba(29,185,84,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(29,185,84,0.35)] hover:bg-[#23d660]"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Contactar por WhatsApp
          </a>
          <a
            href="#servicios"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-transparent text-nz-text font-semibold text-[15px] no-underline border border-nz-border-light transition-all hover:border-nz-green hover:text-nz-green hover:bg-nz-green-glow2"
          >
            Ver servicios ↓
          </a>
        </div>
      </div>
    </section>
  )
}
