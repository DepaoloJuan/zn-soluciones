import { useState, useRef, useEffect } from 'react'
import { enviarMensajeAsistente } from '../lib/api'

export default function AsistentePage() {
  const [mensajes, setMensajes] = useState([
    { rol: 'asistente', texto: 'Hola Nico, ¿en qué te ayudo? Puedo armar presupuestos, ver la agenda, o buscar un cliente.' },
  ])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

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

  return (
    <div className="min-h-screen flex flex-col pt-20 pb-4 max-w-[700px] mx-auto px-4">
      <h1 className="text-xl font-extrabold mb-4">Asistente</h1>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4 px-1">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.rol === 'usuario'
                ? 'bg-nz-green text-black self-end rounded-br-sm'
                : 'bg-nz-surface border border-nz-border text-nz-text self-start rounded-bl-sm'
            }`}
          >
            {m.texto}
          </div>
        ))}
        {enviando && (
          <div className="bg-nz-surface border border-nz-border text-nz-text2 self-start rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-nz-text2 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-nz-text2 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-nz-text2 rounded-full animate-bounce" />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-nz-surface border border-nz-border rounded-full px-2 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí un mensaje..."
          className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-nz-text placeholder:text-nz-text2"
        />
        <button
          type="submit"
          disabled={enviando || !input.trim()}
          className="bg-nz-green text-black rounded-full w-9 h-9 flex items-center justify-center border-none cursor-pointer disabled:opacity-40"
        >
          ➤
        </button>
      </form>
    </div>
  )
}
