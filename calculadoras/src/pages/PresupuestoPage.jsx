import { useState, useEffect } from "react";
import { formatQty, formatNumber } from "../data/materials";
const formatCantidad = (r, budget) => {
  if (r.id === 'masilla' && budget.masillaRecomendacion?.length > 0) {
    return budget.masillaRecomendacion.map(b => `${b.cantidad} × ${b.label} (${b.kg} kg)`).join(' + ')
  }
  if (r.id === 'cinta' && budget.cintaRecomendacion?.length > 0) {
    return budget.cintaRecomendacion.map(b => `${b.cantidad} × ${b.label}`).join(' + ')
  }
  return `${formatQty(r.qty, r.unit)} ${r.unit === 'unidad' ? 'u.' : r.unit}`
}

export default function PresupuestoPage() {
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nz_last_budget");
      if (saved) setBudget(JSON.parse(saved));
    } catch {}
  }, []);

  if (!budget) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32">
        <div className="text-5xl mb-4 opacity-30">📄</div>
        <h2 className="text-2xl font-bold mb-2">Sin presupuesto</h2>
        <p className="text-nz-text2 text-sm">
          Todavía no calculaste ningún presupuesto. Andá a la calculadora y
          completá los datos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 pb-20 pt-24">
      {/* Accion imprimir */}
      <div className="flex justify-end mb-6 no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-nz-green text-nz-bg font-semibold text-sm px-5 py-2.5 rounded-xl border-none cursor-pointer hover:bg-[#23d660] transition-all"
        >
          🖨️ Exportar PDF
        </button>
      </div>

      {/* Documento */}
      <div
        id="presupuesto-doc"
        className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.4)]"
      >
        {/* Header */}
        <div className="bg-[#0a0c0f] px-8 py-6 flex items-center justify-between">
          <img src="/logo.png" alt="NZ Soluciones" className="h-14 w-auto" />
          <div className="text-right">
            <div className="text-white font-bold text-lg tracking-wide">
              NZ Soluciones
            </div>
            <div className="text-[#1db954] text-sm">Hacemos que funcione</div>
            <div className="text-gray-400 text-xs mt-1">
              WhatsApp: 1166582889
            </div>
          </div>
        </div>

        {/* Título presupuesto */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Presupuesto
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {budget.title} · {budget.m2} m² · Desperdicio {budget.waste * 100}
              %
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wider">
              Fecha
            </div>
            <div className="font-semibold text-gray-700">{budget.date}</div>
          </div>
        </div>

        {/* Tabla materiales */}
        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">
                  Material
                </th>
                <th className="text-center py-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">
                  Cantidad
                </th>
                <th className="text-right py-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">
                  Precio unit.
                </th>
                <th className="text-right py-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {budget.rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="py-3 text-center text-gray-600 font-mono">
                    {formatCantidad(r, budget)}
                  </td>
                  <td className="py-3 text-right text-gray-600 font-mono">
                    {r.price > 0 ? `$${formatNumber(r.price)}` : "—"}
                  </td>
                  <td className="py-3 text-right font-semibold font-mono text-gray-800">
                    {r.price > 0 ? `$${formatNumber(r.subtotal)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="mx-8 mb-8 bg-[#0a0c0f] rounded-xl px-6 py-5 flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-base">
              TOTAL PRESUPUESTO
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              ${formatNumber(budget.total / budget.m2)} por m²
            </div>
          </div>
          <div className="text-[#1db954] font-mono font-extrabold text-3xl">
            ${formatNumber(budget.total)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
          Presupuesto generado por NZ Soluciones · nzsoluciones.web.app · Los
          precios pueden variar según disponibilidad de materiales.
        </div>
      </div>
    </div>
  );
}
