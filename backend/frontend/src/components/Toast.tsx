import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import Icon from './Icon';

type ToastKind = 'success' | 'error' | 'info' | 'warning';
type ToastItem = { id: number; kind: ToastKind; message: string };

const iconFor: Record<ToastKind, ReactNode> = {
  success: <Icon name="check" size={14} />,
  error: <Icon name="alert-triangle" size={14} />,
  info: <Icon name="info-circle" size={14} />,
  warning: <Icon name="alert-triangle" size={14} />,
};

const ToastContext = createContext<{ push: (kind: ToastKind, message: string) => void } | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = (toastId += 1);
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {iconFor[t.kind]} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.push;
}
