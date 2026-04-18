import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const LANDING_URL = "https://nzsoluciones.web.app";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { label: "Inicio", to: "/", external: false },
    { label: "Cielorraso", to: "/cielorraso" },
    { label: "Tabique", to: "/tabique" },
    { label: "Presupuesto", to: "/presupuesto" },
    { label: "Presupuesto libre", to: "/presupuesto-libre" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-100 bg-nz-bg/85 backdrop-blur-xl border-b border-nz-border px-6">
      <div className="max-w-[900px] mx-auto flex items-center justify-between h-16">
        <Link
          to="/"
          className="flex items-center gap-3 no-underline text-nz-text"
        >
          <img src="/logo.png" alt="NZ Soluciones" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-wide leading-tight">
              Calculadoras
            </span>
            <span className="text-[10px] text-nz-text2 tracking-wider uppercase">
              NZ Soluciones
            </span>
          </div>
        </Link>

        <ul className="hidden md:flex items-center gap-2">
          {links.map((l) => (
            <li key={l.label}>
              {l.external ? (
                <a
                  href={l.to}
                  className="text-nz-text2 no-underline text-sm font-medium px-4 py-2 rounded-lg transition-all hover:text-nz-green hover:bg-nz-green-glow"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  to={l.to}
                  className={`no-underline text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                    location.pathname === l.to
                      ? "text-nz-green bg-nz-green-glow"
                      : "text-nz-text2 hover:text-nz-green hover:bg-nz-green-glow"
                  }`}
                >
                  {l.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden bg-transparent border-none text-nz-text text-2xl cursor-pointer p-2"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-nz-bg/97 backdrop-blur-xl border-b border-nz-border p-4 flex flex-col gap-1">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.to}
                onClick={() => setOpen(false)}
                className="text-nz-text2 no-underline text-sm font-medium px-4 py-3 rounded-lg hover:text-nz-green hover:bg-nz-green-glow"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`no-underline text-sm font-medium px-4 py-3 rounded-lg ${
                  location.pathname === l.to
                    ? "text-nz-green bg-nz-green-glow"
                    : "text-nz-text2 hover:text-nz-green hover:bg-nz-green-glow"
                }`}
              >
                {l.label}
              </Link>
            ),
          )}
        </div>
      )}
    </nav>
  );
}
