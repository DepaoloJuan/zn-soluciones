import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { enviarMensajeAsistente, getHistorialAsistente, nuevaConversacion, borrarHistorialAsistente } from '../lib/api'
import ConfirmModal from './ConfirmModal'
import { useVozLive } from '../hooks/useVozLive'

export default function AsistenteWidget() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [totalMensajes, setTotalMensajes] = useState(0)
  const [limiteActual, setLimiteActual] = useState(20)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showConfirmBorrar, setShowConfirmBorrar] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [iniciandoConversacion, setIniciandoConversacion] = useState(false)
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [escuchando, setEscuchando] = useState(false)
  const [modoVoz, setModoVoz] = useState(false)
  const { conectado, iniciar, detener, itemsMostrados } = useVozLive()
  const scrollRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (open && mensajes.length === 0) {
      cargarHistorial(20)
    }
  }, [open])

  useEffect(() => {
    if (open) scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, open])

  async function cargarHistorial(limit = 20) {
    setCargandoHistorial(true)
    try {
      const res = await getHistorialAsistente(limit)
      const mapeados = res.mensajes.map((m) => ({ rol: m.rol, texto: m.contenido }))
      setMensajes(mapeados.length > 0 ? mapeados : [
        { rol: 'asistente', texto: 'Hola Nico, ¿en qué te ayudo? Puedo armar presupuestos, ver la agenda, o buscar un cliente.' },
      ])
      setTotalMensajes(res.total)
      setLimiteActual(limit)
    } catch (err) {
      setMensajes([{ rol: 'asistente', texto: `Error cargando historial: ${err.message}` }])
    } finally {
      setCargandoHistorial(false)
    }
  }

  async function handleNuevaConversacion() {
    setShowMenu(false)
    setIniciandoConversacion(true)
    try {
      await nuevaConversacion()
      setMensajes([{ rol: 'asistente', texto: 'Empezamos de cero. ¿En qué te ayudo?' }])
      setTotalMensajes(0)
    } finally {
      setIniciandoConversacion(false)
    }
  }

  async function confirmarBorrarHistorial() {
    setBorrando(true)
    try {
      await borrarHistorialAsistente()
      setMensajes([{ rol: 'asistente', texto: 'Historial borrado. ¿En qué te ayudo?' }])
      setTotalMensajes(0)
      setShowConfirmBorrar(false)
    } catch (err) {
      setMensajes((prev) => [...prev, { rol: 'asistente', texto: `Error: ${err.message}` }])
    } finally {
      setBorrando(false)
    }
  }

  async function enviarMensaje(texto) {
    if (!texto.trim() || enviando) return

    setMensajes((prev) => [...prev, { rol: 'usuario', texto }])
    setInput('')
    setEnviando(true)

    try {
      const res = await enviarMensajeAsistente(texto)
      setMensajes((prev) => [...prev, { rol: 'asistente', texto: res.respuesta }])
    } catch (err) {
      setMensajes((prev) => [...prev, { rol: 'asistente', texto: `Error: ${err.message}` }])
    } finally {
      setEnviando(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    enviarMensaje(input)
  }

  function toggleMicrofono() {
    if (escuchando) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMensajes((prev) => [...prev, { rol: 'asistente', texto: 'Tu navegador no soporta reconocimiento de voz. Probá con Chrome.' }])
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-AR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setEscuchando(true)
    recognition.onend = () => setEscuchando(false)
    recognition.onerror = () => setEscuchando(false)

    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript
      enviarMensaje(texto)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-nz-green text-black text-2xl flex items-center justify-center border-none cursor-pointer shadow-[0_4px_20px_rgba(29,185,84,0.4)] hover:scale-105 transition-transform"
        aria-label="Abrir asistente"
      >
        💬
      </button>
    )
  }

  return (
    <div
      className={`fixed z-[200] bg-nz-surface border border-nz-border rounded-2xl shadow-2xl flex flex-col transition-all ${
        expanded
          ? 'inset-4 md:inset-10'
          : 'bottom-6 right-6 w-[340px] h-[480px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-100px)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-nz-border relative">
        <span className="font-semibold text-sm">Asistente NZ</span>
        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              if (modoVoz) {
                detener()
                setModoVoz(false)
              } else {
                setModoVoz(true)
                await iniciar()
              }
            }}
            className={`bg-transparent border-none cursor-pointer text-sm px-2 py-1 ${
              modoVoz ? 'text-nz-green' : 'text-nz-text2 hover:text-nz-green'
            }`}
            aria-label={modoVoz ? 'Cortar llamada' : 'Hablar con el asistente'}
            title={modoVoz ? 'Cortar llamada' : 'Conversación por voz'}
          >
            📞
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-nz-text2 hover:text-nz-green bg-transparent border-none cursor-pointer text-sm px-2 py-1"
            aria-label="Opciones"
          >
            ⋮
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-nz-text2 hover:text-nz-green bg-transparent border-none cursor-pointer text-sm px-2 py-1"
            aria-label={expanded ? 'Achicar' : 'Agrandar'}
          >
            {expanded ? '⤡' : '⤢'}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-nz-text2 hover:text-red-500 bg-transparent border-none cursor-pointer text-lg px-2 py-1"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {showMenu && (
            <div className="absolute top-full right-2 mt-1 bg-nz-surface2 border border-nz-border rounded-xl overflow-hidden shadow-lg min-w-[180px] z-10">
              <button
                onClick={handleNuevaConversacion}
                disabled={iniciandoConversacion}
                className="w-full text-left px-4 py-2.5 text-sm text-nz-text hover:bg-nz-green-glow bg-transparent border-none cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {iniciandoConversacion && (
                  <span className="w-3 h-3 border-2 border-nz-text/30 border-t-nz-text rounded-full animate-spin" />
                )}
                Nueva conversación
              </button>
              <button
                onClick={() => { setShowMenu(false); setShowConfirmBorrar(true); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 bg-transparent border-none cursor-pointer"
              >
                Borrar historial
              </button>
            </div>
          )}
        </div>
      </div>

      {modoVoz && (
        <div className="flex flex-col items-center flex-1 gap-3 p-6 overflow-y-auto">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0 ${
            conectado ? 'bg-nz-green/20 animate-pulse' : 'bg-nz-surface2'
          }`}>
            🎙️
          </div>
          <span className="text-sm text-nz-text2 flex-shrink-0">
            {conectado ? 'Escuchando... hablá cuando quieras' : 'Conectando...'}
          </span>

          {itemsMostrados.length > 0 && (
            <div className="w-full flex flex-col gap-2 mt-2">
              {itemsMostrados.map(({ tipo, item }) => (
                <Link
                  key={`${tipo}-${item.id}`}
                  to={tipo === 'trabajo' ? `/trabajos/${item.id}` : `/presupuestos/${item.id}`}
                  className="bg-nz-surface2 border border-nz-green/30 rounded-xl px-4 py-3 no-underline text-nz-text hover:bg-nz-green-glow transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {tipo === 'trabajo' ? item.cliente_nombre : `Presupuesto ${item.category}`}
                    </div>
                    <div className="text-xs text-nz-text2">
                      {tipo === 'trabajo'
                        ? `${item.descripcion || 'Sin descripción'} · ${item.estado}`
                        : `${item.m2} m² · $${item.total?.toLocaleString('es-AR')}`}
                    </div>
                  </div>
                  <span className="text-nz-green text-sm">Ver →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
        {totalMensajes > limiteActual && (
          <button
            onClick={() => cargarHistorial(limiteActual + 20)}
            disabled={cargandoHistorial}
            className="self-center text-xs text-nz-green bg-transparent border-none cursor-pointer hover:underline disabled:opacity-50"
          >
            {cargandoHistorial ? 'Cargando...' : 'Ver mensajes anteriores'}
          </button>
        )}
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.rol === 'usuario'
                ? 'bg-nz-green text-black self-end rounded-br-sm'
                : 'bg-nz-surface2 border border-nz-border text-nz-text self-start rounded-bl-sm'
            }`}
          >
            {m.texto}
          </div>
        ))}
        {enviando && (
          <div className="bg-nz-surface2 border border-nz-border text-nz-text2 self-start rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-nz-text2 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-nz-text2 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-nz-text2 rounded-full animate-bounce" />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-nz-border p-2">
        <button
          type="button"
          onClick={toggleMicrofono}
          className={`rounded-full w-9 h-9 flex-shrink-0 flex items-center justify-center border-none cursor-pointer transition-all ${
            escuchando ? 'bg-red-500 text-white animate-pulse' : 'bg-nz-surface2 text-nz-text2 hover:text-nz-green'
          }`}
          aria-label={escuchando ? 'Detener' : 'Hablar'}
        >
          🎤
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={escuchando ? 'Escuchando...' : 'Escribí un mensaje...'}
          disabled={escuchando}
          className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-nz-text placeholder:text-nz-text2"
        />
        <button
          type="submit"
          disabled={enviando || !input.trim()}
          className="bg-nz-green text-black rounded-full w-9 h-9 flex-shrink-0 flex items-center justify-center border-none cursor-pointer disabled:opacity-40"
        >
          ➤
        </button>
      </form>
      <ConfirmModal
        open={showConfirmBorrar}
        title="Borrar historial"
        message="¿Seguro que querés borrar todo el historial de conversación con el asistente? Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        danger
        loading={borrando}
        onConfirm={confirmarBorrarHistorial}
        onCancel={() => setShowConfirmBorrar(false)}
      />
    </div>
  )
}
