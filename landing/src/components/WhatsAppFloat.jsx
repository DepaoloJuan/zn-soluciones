import { useState } from 'react'
import WhatsAppIcon from './WhatsAppIcon'

const WA_LINK = 'https://wa.me/5491166582889?text=Hola%2C%20quiero%20pedir%20un%20presupuesto'

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[280px] bg-nz-surface border border-nz-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden animate-[fade-up_0.2s_ease_both]">
          {/* Header */}
          <div className="bg-nz-wa px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <WhatsAppIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Nicolás</div>
              <div className="text-white/70 text-xs">NZ Soluciones</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto bg-transparent border-none text-white/70 cursor-pointer text-lg hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Message bubble */}
          <div className="px-4 py-5">
            <div className="bg-nz-surface2 rounded-xl rounded-tl-none px-4 py-3 text-sm text-nz-text leading-relaxed">
              👋 ¡Hola! ¿En qué te puedo ayudar?<br />
              Contame qué necesitás y te damos un presupuesto sin cargo.
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 pb-4">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-nz-wa text-white no-underline font-semibold text-sm py-3 rounded-xl transition-all hover:bg-[#20bd5a]"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Abrir WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-[60px] h-[60px] bg-nz-wa rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(37,211,102,0.4)] transition-all hover:scale-110 hover:shadow-[0_6px_32px_rgba(37,211,102,0.5)] border-none cursor-pointer"
        aria-label="WhatsApp"
      >
        <WhatsAppIcon className="w-[30px] h-[30px] text-white" />
      </button>
    </>
  )
}
