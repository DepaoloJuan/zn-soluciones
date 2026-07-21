export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirmar', danger = false, loading = false, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onCancel}>
      <div
        className="bg-nz-surface border border-nz-border rounded-xl p-6 w-full max-w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-nz-text2 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-nz-surface2 text-nz-text2 border border-nz-border disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${
              danger ? 'bg-red-500 text-white' : 'bg-nz-green text-black'
            }`}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
