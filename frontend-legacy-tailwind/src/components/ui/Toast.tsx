import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import type { Toast as ToastType, ToastType as ToastVariant } from '../../types'

// ─── Context ──────────────────────────────────────────────
interface ToastContextValue {
  showToast: (message: string, type?: ToastVariant, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// ─── Icons ────────────────────────────────────────────────
const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-green-400" />,
  error:   <XCircle    size={16} className="text-red-400"   />,
  warning: <AlertCircle size={16} className="text-yellow-400" />,
  info:    <Info        size={16} className="text-blue-400"  />,
}

const borderColors: Record<ToastVariant, string> = {
  success: 'border-l-green-400',
  error:   'border-l-red-400',
  warning: 'border-l-yellow-400',
  info:    'border-l-blue-400',
}

// ─── Single Toast Item ────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
  return (
    <div
      className={`
        toast-enter flex items-start gap-3 min-w-[300px] max-w-sm
        bg-[var(--color-card)] border border-[var(--color-border)]
        border-l-4 ${borderColors[toast.type]}
        rounded-xl shadow-modal px-4 py-3
      `}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.type]}</span>
      <p className="flex-1 text-sm text-[var(--color-text)] leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastVariant = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message, duration }])
    setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
