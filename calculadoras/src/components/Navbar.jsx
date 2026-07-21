import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth";

const NAV_GROUPS = [
  {
    label: "Calculadoras",
    items: [
      { label: "Cielorraso", to: "/cielorraso" },
      { label: "Tabique", to: "/tabique" },
    ],
  },
  {
    label: "Presupuestos",
    items: [
      { label: "Presupuesto", to: "/presupuesto" },
      { label: "Presupuesto libre", to: "/presupuesto-libre" },
    ],
  },
  { label: "Trabajos", to: "/trabajos" },
  { label: "Clientes", to: "/clientes" },
  { label: "Agenda", to: "/agenda" },
  { label: "Materiales", to: "/admin/materiales" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function isGroupActive(group) {
    if (group.to) return location.pathname === group.to;
    return group.items.some((i) => i.to === location.pathname);
  }

  return (
    <nav ref={navRef} className="fixed top-0 left-0 w-full z-100 bg-nz-bg/85 backdrop-blur-xl border-b border-nz-border px-6">
      <div className="max-w-[900px] mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 no-underline text-nz-text">
          <img src="/logo.png" alt="NZ Soluciones" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-wide leading-tight">Gestión</span>
            <span className="text-[10px] text-nz-text2 tracking-wider uppercase">NZ Soluciones</span>
          </div>
        </Link>

        {/* Nav desktop */}
        <ul className="hidden md:flex items-center gap-1 relative">
          {NAV_GROUPS.map((group) => (
            <li key={group.label} className="relative">
              {group.to ? (
                <Link
                  to={group.to}
                  className={`no-underline text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                    isGroupActive(group)
                      ? "text-nz-green bg-nz-green-glow"
                      : "text-nz-text2 hover:text-nz-green hover:bg-nz-green-glow"
                  }`}
                >
                  {group.label}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === group.label ? null : group.label)}
                    className={`flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg transition-all bg-transparent border-none cursor-pointer ${
                      isGroupActive(group)
                        ? "text-nz-green bg-nz-green-glow"
                        : "text-nz-text2 hover:text-nz-green hover:bg-nz-green-glow"
                    }`}
                  >
                    {group.label}
                    <span className="text-[10px]">{openDropdown === group.label ? "▲" : "▼"}</span>
                  </button>

                  {openDropdown === group.label && (
                    <div className="absolute top-full left-0 mt-1 bg-nz-surface border border-nz-border rounded-xl overflow-hidden shadow-lg min-w-[160px]">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpenDropdown(null)}
                          className={`block no-underline text-sm font-medium px-4 py-2.5 transition-all ${
                            location.pathname === item.to
                              ? "text-nz-green bg-nz-green-glow"
                              : "text-nz-text2 hover:text-nz-green hover:bg-nz-green-glow"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>

        {/* Logout, separado */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="hidden md:flex items-center gap-2 whitespace-nowrap text-nz-text2 text-sm font-medium px-4 py-2 rounded-lg transition-all hover:text-red-500 hover:bg-red-500/10 bg-transparent border border-nz-border cursor-pointer disabled:opacity-50"
        >
          {loggingOut && (
            <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          )}
          {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
        </button>

        {/* Hamburguesa mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden bg-transparent border-none text-nz-text text-2xl cursor-pointer p-2"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden bg-nz-bg/97 backdrop-blur-xl border-b border-nz-border p-4 flex flex-col gap-1">
          {NAV_GROUPS.map((group) =>
            group.to ? (
              <Link
                key={group.label}
                to={group.to}
                onClick={() => setOpen(false)}
                className={`no-underline text-sm font-medium px-4 py-3 rounded-lg ${
                  location.pathname === group.to
                    ? "text-nz-green bg-nz-green-glow"
                    : "text-nz-text2 hover:text-nz-green hover:bg-nz-green-glow"
                }`}
              >
                {group.label}
              </Link>
            ) : (
              <div key={group.label}>
                <div className="text-[11px] text-nz-text2 uppercase tracking-wider px-4 pt-3 pb-1">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`block no-underline text-sm font-medium px-6 py-2.5 rounded-lg ${
                      location.pathname === item.to
                        ? "text-nz-green bg-nz-green-glow"
                        : "text-nz-text2 hover:text-nz-green hover:bg-nz-green-glow"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )
          )}
          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            disabled={loggingOut}
            className="text-red-500 text-sm font-medium px-4 py-3 rounded-lg hover:bg-red-500/10 bg-transparent border-none cursor-pointer text-left mt-2 flex items-center gap-2 disabled:opacity-50"
          >
            {loggingOut && (
              <span className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            )}
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </nav>
  );
}
