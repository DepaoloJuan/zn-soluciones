import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'
import { formatNumber } from "../data/materials";
import { getClientes, createCliente } from '../lib/api'
import GuardarPresupuestoModal from '../components/GuardarPresupuestoModal'
import { DATOS_PAGO } from '../data/datosPago'

export default function PresupuestoLibrePage() {
  const navigate = useNavigate()
  const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clientesList, setClientesList] = useState([]);
  const [modoCliente, setModoCliente] = useState('existente');
  const [clienteSeleccionadoTmp, setClienteSeleccionadoTmp] = useState('');
  const [nombreClienteNuevo, setNombreClienteNuevo] = useState('');
  const [telefonoClienteNuevo, setTelefonoClienteNuevo] = useState('');
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [clienteError, setClienteError] = useState('');
  const [descripcion, setDescripcion] = useState("");
  const [items, setItems] = useState([{ desc: "", precio: "" }]);
  const [materiales, setMateriales] = useState([""]);
  const [datosPago, setDatosPago] = useState(DATOS_PAGO);
  const [showSaveModal, setShowSaveModal] = useState(false)

  const total = items.reduce((acc, i) => acc + (parseFloat(i.precio) || 0), 0);

  function addItem() {
    setItems([...items, { desc: "", precio: "" }]);
  }

  function updateItem(index, field, value) {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addMaterial() {
    setMateriales([...materiales, ""]);
  }

  function updateMaterial(index, value) {
    const updated = [...materiales];
    updated[index] = value;
    setMateriales(updated);
  }

  function removeMaterial(index) {
    setMateriales(materiales.filter((_, i) => i !== index));
  }

  function openClienteModal() {
    setClienteError('')
    setModoCliente('existente')
    setClienteSeleccionadoTmp('')
    setNombreClienteNuevo('')
    setTelefonoClienteNuevo('')
    setShowClienteModal(true)
  }

  async function confirmarCliente() {
    setClienteError('')

    if (modoCliente === 'existente') {
      if (!clienteSeleccionadoTmp) {
        setClienteError('Elegí un cliente')
        return
      }
      const elegido = clientesList.find((c) => String(c.id) === String(clienteSeleccionadoTmp))
      setClienteId(elegido.id)
      setCliente(elegido.nombre)
      setShowClienteModal(false)
      return
    }

    if (!nombreClienteNuevo.trim()) {
      setClienteError('Ingresá el nombre del cliente')
      return
    }

    setCreandoCliente(true)
    try {
      const res = await createCliente({ nombre: nombreClienteNuevo, telefono: telefonoClienteNuevo || null })
      setClienteId(res.cliente.id)
      setCliente(res.cliente.nombre)
      setClientesList((prev) => [...prev, res.cliente])
      setShowClienteModal(false)
    } catch (err) {
      setClienteError(err.message)
    } finally {
      setCreandoCliente(false)
    }
  }

  useEffect(() => {
    getClientes().then((res) => setClientesList(res.clientes)).catch(() => {})
  }, [])

  return (
    <div className="max-w-[800px] mx-auto px-4 pb-20 pt-24">
      {/* Acciones */}
      <div className="flex justify-end gap-3 mb-6 no-print">
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 bg-nz-green text-nz-bg font-semibold text-sm px-5 py-2.5 rounded-xl border-none cursor-pointer hover:bg-[#23d660] transition-all"
        >
          💾 Guardar presupuesto
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-nz-surface2 text-nz-text font-semibold text-sm px-5 py-2.5 rounded-xl border border-nz-border cursor-pointer hover:border-nz-green transition-all"
        >
          🖨️ Exportar PDF
        </button>
      </div>

      {/* Formulario — solo visible en pantalla */}
      <div className="no-print space-y-4 mb-8">
        {/* Cliente */}
        <div className="bg-nz-surface border border-nz-border rounded-xl p-6">
          <div className="font-mono text-[11px] tracking-[3px] uppercase text-nz-text2 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-nz-green rounded-full" />
            Datos del cliente
          </div>
          {clienteId ? (
            <div className="flex items-center justify-between bg-nz-surface2 border border-nz-border rounded-lg px-4 py-2.5">
              <span className="text-sm font-medium">{cliente}</span>
              <button
                onClick={openClienteModal}
                className="text-nz-green text-xs font-medium bg-transparent border-none cursor-pointer hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <button
              onClick={openClienteModal}
              className="w-full bg-nz-surface2 border border-dashed border-nz-border rounded-lg text-nz-text2 text-sm px-4 py-2.5 cursor-pointer hover:border-nz-green hover:text-nz-green transition-all"
            >
              + Seleccionar cliente
            </button>
          )}
        </div>

        {/* Items */}
        <div className="bg-nz-surface border border-nz-border rounded-xl p-6">
          <div className="font-mono text-[11px] tracking-[3px] uppercase text-nz-text2 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-nz-green rounded-full" />
            Ítems / Mano de obra
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Descripción"
                value={item.desc}
                onChange={(e) => updateItem(i, "desc", e.target.value)}
                className="flex-1 bg-nz-surface2 border border-nz-border rounded-lg text-nz-text text-sm px-3 py-2 outline-none focus:border-nz-green"
              />
              <input
                type="number"
                placeholder="Precio"
                value={item.precio}
                onChange={(e) => updateItem(i, "precio", e.target.value)}
                className="w-[130px] bg-nz-surface2 border border-nz-border rounded-lg text-nz-text font-mono text-sm px-3 py-2 outline-none focus:border-nz-green text-right"
              />
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(i)}
                  className="text-nz-red bg-transparent border-none cursor-pointer text-lg px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addItem}
            className="mt-2 text-nz-green text-sm font-medium bg-transparent border-none cursor-pointer hover:underline"
          >
            + Agregar ítem
          </button>
        </div>

        {/* Materiales */}
        <div className="bg-nz-surface border border-nz-border rounded-xl p-6">
          <div className="font-mono text-[11px] tracking-[3px] uppercase text-nz-text2 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-nz-green rounded-full" />
            Materiales a utilizar
          </div>
          {materiales.map((mat, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ej: 4 ltrs pintura latex"
                value={mat}
                onChange={(e) => updateMaterial(i, e.target.value)}
                className="flex-1 bg-nz-surface2 border border-nz-border rounded-lg text-nz-text text-sm px-3 py-2 outline-none focus:border-nz-green"
              />
              {materiales.length > 1 && (
                <button
                  onClick={() => removeMaterial(i)}
                  className="text-nz-red bg-transparent border-none cursor-pointer text-lg px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addMaterial}
            className="mt-2 text-nz-green text-sm font-medium bg-transparent border-none cursor-pointer hover:underline"
          >
            + Agregar material
          </button>
        </div>

        {/* Descripción */}
        <div className="bg-nz-surface border border-nz-border rounded-xl p-6">
          <div className="font-mono text-[11px] tracking-[3px] uppercase text-nz-text2 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-nz-green rounded-full" />
            Descripción del trabajo
          </div>
          <textarea
            placeholder="Describí el trabajo a realizar..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            className="w-full bg-nz-surface2 border border-nz-border rounded-lg text-nz-text text-sm px-4 py-2.5 outline-none focus:border-nz-green resize-none"
          />
        </div>

        {/* Datos de pago */}
        <div className="bg-nz-surface border border-nz-border rounded-xl p-6">
          <div className="font-mono text-[11px] tracking-[3px] uppercase text-nz-text2 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-nz-green rounded-full" />
            Información para el pago
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1">
              <label className="text-xs text-nz-text2 mb-1 block">Alias</label>
              <input
                type="text"
                value={datosPago.alias}
                onChange={(e) =>
                  setDatosPago({ ...datosPago, alias: e.target.value })
                }
                className="w-full bg-nz-surface2 border border-nz-border rounded-lg text-nz-text text-sm px-3 py-2 outline-none focus:border-nz-green"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-nz-text2 mb-1 block">
                Beneficiario
              </label>
              <input
                type="text"
                value={datosPago.beneficiario}
                onChange={(e) =>
                  setDatosPago({ ...datosPago, beneficiario: e.target.value })
                }
                className="w-full bg-nz-surface2 border border-nz-border rounded-lg text-nz-text text-sm px-3 py-2 outline-none focus:border-nz-green"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Documento imprimible */}
      <div className="bg-white text-gray-900">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b-2 border-gray-200">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">Presupuesto</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1db954] to-[#1db954]/60 rounded-xl px-8 py-4 shadow-[0_0_32px_rgba(29,185,84,0.5)]">
            <img src="/logo.png" alt="NZ Soluciones" className="h-24 w-auto" />
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Fecha y cliente */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Presupuesto
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {cliente && (
              <div className="text-right">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Cliente
                </div>
                <div className="font-semibold text-gray-700">{cliente}</div>
              </div>
            )}
          </div>

          {/* Tabla ítems */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-[#1db954]">
                <th className="text-left py-2.5 px-4 font-semibold text-white uppercase text-xs tracking-wider">Descripción</th>
                <th className="text-right py-2.5 px-4 font-semibold text-white uppercase text-xs tracking-wider">Jornal</th>
              </tr>
            </thead>
            <tbody>
              {items.filter(i => i.desc || i.precio).map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#1db954]/10'}>
                  <td className="py-3 px-4 text-gray-800">{item.desc}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-800">
                    {item.precio ? `$${formatNumber(parseFloat(item.precio))}` : '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#1db954]/20">
                <td className="py-3 px-4 font-bold text-gray-900">TOTAL</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">${formatNumber(total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Materiales */}
          {materiales.filter((m) => m).length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Materiales a utilizar:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {materiales
                  .filter((m) => m)
                  .map((mat, i) => (
                    <li key={i} className="text-sm text-gray-600">
                      {mat}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Descripción */}
          {descripcion && (
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {descripcion}
            </p>
          )}
        </div>

        {/* Total mano de obra */}
        <div className="mx-8 mb-6 bg-[#1db954]/20 rounded-xl px-6 py-5 flex justify-between items-center">
          <div className="text-gray-900 font-bold text-base">
            TOTAL — MANO DE OBRA
          </div>
          <div className="text-[#1db954] font-mono font-extrabold text-3xl">
            ${formatNumber(total)}
          </div>
        </div>

        {/* Footer pago y contacto */}
        <div className="mx-8 mb-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">
              Información para el pago
            </p>
            <p className="text-gray-600">
              Alias:{" "}
              <span className="font-medium text-gray-800">
                {datosPago.alias}
              </span>
            </p>
            <p className="text-gray-600">
              Beneficiario:{" "}
              <span className="font-medium text-gray-800">
                {datosPago.beneficiario}
              </span>
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">
              Datos de contacto
            </p>
            <p className="text-gray-600">11-6658-2889 Nicolas Zarate</p>
            <p className="text-gray-600">zaratediegonicolas@gmail.com</p>
          </div>
        </div>
      </div>

      {showClienteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 no-print" onClick={() => setShowClienteModal(false)}>
          <div
            className="bg-nz-surface border border-nz-border rounded-xl p-6 w-full max-w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Seleccionar cliente</h3>

            {clienteError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
                {clienteError}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setModoCliente('existente')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  modoCliente === 'existente' ? 'bg-nz-green text-black border-nz-green' : 'bg-nz-surface2 text-nz-text2 border-nz-border'
                }`}
              >
                Cliente existente
              </button>
              <button
                onClick={() => setModoCliente('nuevo')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  modoCliente === 'nuevo' ? 'bg-nz-green text-black border-nz-green' : 'bg-nz-surface2 text-nz-text2 border-nz-border'
                }`}
              >
                Cliente nuevo
              </button>
            </div>

            {modoCliente === 'existente' ? (
              <select
                value={clienteSeleccionadoTmp}
                onChange={(e) => setClienteSeleccionadoTmp(e.target.value)}
                className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green mb-4"
              >
                <option value="">Elegí un cliente...</option>
                {clientesList.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            ) : (
              <>
                <input
                  placeholder="Nombre del cliente"
                  value={nombreClienteNuevo}
                  onChange={(e) => setNombreClienteNuevo(e.target.value)}
                  className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green mb-3"
                />
                <input
                  placeholder="Teléfono (opcional)"
                  value={telefonoClienteNuevo}
                  onChange={(e) => setTelefonoClienteNuevo(e.target.value)}
                  className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green mb-4"
                />
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowClienteModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-nz-surface2 text-nz-text2 border border-nz-border"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCliente}
                disabled={creandoCliente}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-nz-green text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creandoCliente && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                {creandoCliente ? 'Creando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <GuardarPresupuestoModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        preselectedClienteId={clienteId}
        preselectedClienteNombre={cliente}
        buildPresupuesto={() => ({
          category: 'libre',
          m2: 0,
          waste: 0,
          materials: {
            cliente,
            descripcion,
            items: items.filter((i) => i.desc || i.precio),
            materiales: materiales.filter((m) => m),
            datosPago,
          },
          total,
        })}
        onSaved={(trabajoId) => navigate(`/trabajos/${trabajoId}`)}
      />
    </div>
  );
}
