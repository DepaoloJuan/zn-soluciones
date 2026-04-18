import WhatsAppIcon from './WhatsAppIcon'

const WA_LINK = 'https://wa.me/5491166582889?text=Hola%2C%20quiero%20pedir%20un%20presupuesto'

export default function Footer() {
  return (
    <footer className="border-t border-nz-border py-12 px-6">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-nz-green rounded-md flex items-center justify-center font-mono font-extrabold text-[13px] text-nz-bg">
            NZ
          </div>
          <div>
            <span className="font-bold text-[15px]">NZ Soluciones</span>
            <div className="text-[13px] text-nz-text2">Hacemos que funcione</div>
          </div>
        </div>

        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-nz-wa text-white no-underline px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(37,211,102,0.3)]"
        >
          <WhatsAppIcon className="w-[18px] h-[18px]" />
          Nicolás — 1166582889
        </a>
      </div>
    </footer>
  )
}
