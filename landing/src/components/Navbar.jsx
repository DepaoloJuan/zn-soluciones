import { useState } from 'react'

const WA_LINK = 'https://wa.me/5491166582889?text=Hola%2C%20quiero%20pedir%20un%20presupuesto'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const links = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Servicios', href: '#servicios' },
  ]

  return (
    <nav className="fixed top-0 left-0 w-full z-100 bg-nz-bg/85 backdrop-blur-xl border-b border-nz-border px-6">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between h-16">
        <a href="#inicio" className="flex items-center gap-3 no-underline text-nz-text">
          <img src="/logo.png" alt="NZ Soluciones" className="h-10 w-auto" />
        </a>

        <ul className="hidden md:flex items-center gap-2">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="text-nz-text2 no-underline text-sm font-medium px-4 py-2 rounded-lg transition-all hover:text-nz-green hover:bg-nz-green-glow"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-nz-green text-nz-bg no-underline text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:bg-[#23d660]"
            >
              Presupuesto
            </a>
          </li>
        </ul>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden bg-transparent border-none text-nz-text text-2xl cursor-pointer p-2"
          aria-label="Menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-nz-bg/97 backdrop-blur-xl border-b border-nz-border p-4 flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-nz-text2 no-underline text-sm font-medium px-4 py-3 rounded-lg transition-all hover:text-nz-green hover:bg-nz-green-glow"
            >
              {l.label}
            </a>
          ))}
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-nz-green text-nz-bg no-underline text-sm font-semibold px-4 py-3 rounded-lg text-center mt-2"
          >
            Pedir Presupuesto
          </a>
        </div>
      )}
    </nav>
  )
}
