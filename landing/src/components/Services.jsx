import { useEffect, useRef } from 'react'

const SERVICES = [
  { icon: '🏗️', title: 'Remodelaciones integrales', desc: 'Transformamos espacios completos con planificación y ejecución profesional.' },
  { icon: '🏢', title: 'Mantenimiento para consorcios', desc: 'Servicio integral de mantenimiento edilicio para edificios y consorcios.' },
  { icon: '⚡', title: 'Instalaciones eléctricas', desc: 'Instalación, reparación y puesta a norma de sistemas eléctricos.' },
  { icon: '🔧', title: 'Plomería y Gas', desc: 'Instalaciones y reparaciones de agua, cloacas y gas con matriculados.' },
  { icon: '📐', title: 'Cielorrasos Durlock y PVC', desc: 'Cielorrasos suspendidos, aplicados, con aislación. Durlock y PVC.' },
  { icon: '🧱', title: 'Tabiques', desc: 'Divisiones internas en construcción en seco. Simple y doble placa.' },
  { icon: '🔩', title: 'Herrería', desc: 'Rejas, portones, barandas, escaleras y trabajos a medida en hierro.' },
  { icon: '🎨', title: 'Pintura en general', desc: 'Pintura interior y exterior, impermeabilizaciones y tratamientos especiales.' },
]

function ServiceCard({ icon, title, desc, delay }) {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-8')
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-8 transition-all duration-600 ease-out bg-nz-surface border border-nz-border rounded-xl p-7 relative overflow-hidden group hover:-translate-y-1 hover:border-nz-border-light"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-nz-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="w-12 h-12 rounded-[10px] bg-nz-green-glow flex items-center justify-center text-[22px] mb-5">
        {icon}
      </div>
      <h3 className="text-[17px] font-bold mb-2">{title}</h3>
      <p className="text-sm text-nz-text2 leading-relaxed">{desc}</p>
    </div>
  )
}

export default function Services() {
  return (
    <section id="servicios" className="py-24 px-6 max-w-[1100px] mx-auto">
      <p className="font-mono text-xs tracking-[4px] uppercase text-nz-green mb-4">
        Servicios
      </p>
      <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight mb-4">
        Todo lo que necesitás para tu obra
      </h2>
      <p className="text-base text-nz-text2 max-w-[500px] leading-relaxed mb-12">
        Desde la estructura hasta el último detalle, con materiales de calidad y mano de obra especializada.
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {SERVICES.map((s, i) => (
          <ServiceCard key={s.title} {...s} delay={i * 60} />
        ))}
      </div>
    </section>
  )
}
