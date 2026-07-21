import { useRef, useState, useCallback } from 'react'

// Nota: usamos ScriptProcessorNode porque es más simple de entender y sigue
// funcionando en todos los navegadores, aunque está deprecado a favor de
// AudioWorklet. Si más adelante notamos glitches de audio, migramos a eso.

export function useVozLive() {
  const [conectado, setConectado] = useState(false)
  const [itemsMostrados, setItemsMostrados] = useState([])
  const wsRef = useRef(null)
  const audioContextRef = useRef(null)
  const streamRef = useRef(null)
  const processorRef = useRef(null)
  const playbackContextRef = useRef(null)
  const nextStartTimeRef = useRef(0)

  const iniciar = useCallback(async () => {
    const wsUrl = import.meta.env.VITE_BACKEND_URL.replace(/^http/, 'ws') + '/api/voz'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    // Creamos y "despertamos" el contexto de reproducción ya en el gesto del usuario
    playbackContextRef.current = new AudioContext({ sampleRate: 24000 })
    await playbackContextRef.current.resume()
    nextStartTimeRef.current = playbackContextRef.current.currentTime

    ws.onopen = () => setConectado(true)
    ws.onclose = () => setConectado(false)
    ws.onerror = (e) => console.error('Error WS voz:', e)

    ws.onmessage = async (event) => {
      let data = event.data
      if (data instanceof Blob) data = await data.text()
      console.log('RAW mensaje recibido:', typeof data, data?.slice ? data.slice(0, 100) : data)

      let msg
      try {
        msg = JSON.parse(data)
      } catch (err) {
        console.error('Error parseando JSON:', err)
        return
      }

      if (msg.nzEvento?.tipo === 'trabajo' || msg.nzEvento?.tipo === 'presupuesto') {
        const { tipo, item } = msg.nzEvento
        setItemsMostrados((prev) => {
          // Evita duplicar la misma tarjeta si Gemini vuelve a consultar lo mismo
          const yaExiste = prev.some((p) => p.tipo === tipo && p.item.id === item.id)
          if (yaExiste) return prev
          return [...prev, { tipo, item }]
        })
        return
      }

      const serverContent = msg.serverContent
      console.log('serverContent:', serverContent)
      if (!serverContent) return

      if (serverContent.interrupted) {
        // El usuario interrumpió: cortamos lo que estaba sonando
        nextStartTimeRef.current = playbackContextRef.current?.currentTime || 0
        return
      }

      const parts = serverContent.modelTurn?.parts || []
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('audio/pcm')) {
          reproducirChunk(part.inlineData.data)
        }
      }
    }

    function reproducirChunk(base64Data) {
      const ctx = playbackContextRef.current
      console.log('Estado del audio context:', ctx.state)

      const binary = atob(base64Data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const pcm16 = new Int16Array(bytes.buffer)

      const float32 = new Float32Array(pcm16.length)
      for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x8000

      const buffer = ctx.createBuffer(1, float32.length, 24000)
      buffer.copyToChannel(float32, 0)

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)

      const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime)
      console.log('Programando audio en:', startTime, 'duración:', buffer.duration, 'ahora:', ctx.currentTime)
      source.start(startTime)
      nextStartTimeRef.current = startTime + buffer.duration
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const audioContext = new AudioContext({ sampleRate: 16000 })
    audioContextRef.current = audioContext

    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return
      const input = e.inputBuffer.getChannelData(0)
      const pcm16 = floatTo16BitPCM(input)
      const base64 = arrayBufferToBase64(pcm16.buffer)
      ws.send(JSON.stringify({
        realtimeInput: { audio: { data: base64, mimeType: 'audio/pcm;rate=16000' } },
      }))
    }

    source.connect(processor)
    processor.connect(audioContext.destination)
  }, [])

  const detener = useCallback(() => {
    processorRef.current?.disconnect()
    audioContextRef.current?.close()
    playbackContextRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    wsRef.current?.close()
    setConectado(false)
    setItemsMostrados([])
  }, [])

  return { conectado, iniciar, detener, itemsMostrados }
}

function floatTo16BitPCM(input) {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return output
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
