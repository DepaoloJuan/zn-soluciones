const CALC_URL = "https://calc.nzsoluciones.web.app";

const calculators = [
  {
    icon: "📐",
    title: "Cielorraso",
    desc: "Placa simple",
    href: null,
    active: false,
  },
  {
    icon: "🧱",
    title: "Tabique",
    desc: "Placa simple",
    href: null,
    active: false,
  },
];

export default function CalcCTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1100px] mx-auto bg-nz-surface border border-nz-border rounded-2xl p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(29,185,84,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex-1">
          <p className="font-mono text-xs tracking-[4px] uppercase text-nz-green mb-4">
            Herramientas
          </p>
          <h2 className="text-[clamp(24px,3vw,36px)] font-extrabold tracking-tight mb-3">
            Calculadoras de materiales
          </h2>
          <p className="text-base text-nz-text2 leading-relaxed max-w-[440px]">
            Calculá la cantidad exacta de materiales y armá tu presupuesto al
            instante. Rápido, sin errores.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 flex-wrap">
          {calculators.map((c) =>
            c.active ? (
              <a
                key={c.title}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-nz-surface2 border border-nz-border rounded-xl p-6 w-[200px] no-underline text-nz-text text-center transition-all hover:border-nz-green hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(29,185,84,0.1)]"
              >
                <div className="text-[32px] mb-3">{c.icon}</div>
                <h4 className="text-[15px] font-bold mb-1">{c.title}</h4>
                <p className="text-xs text-nz-text2">{c.desc}</p>
              </a>
            ) : (
              <div
                key={c.title}
                className="bg-nz-surface2 border border-nz-border rounded-xl p-6 w-[200px] text-center opacity-45"
              >
                <div className="text-[32px] mb-3">{c.icon}</div>
                <h4 className="text-[15px] font-bold mb-1">{c.title}</h4>
                <p className="text-xs text-nz-text2">{c.desc}</p>
                <span className="block mt-2 font-mono text-[10px] tracking-[1px] uppercase text-nz-green">
                  Próximamente
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
