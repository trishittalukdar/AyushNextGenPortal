import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export type ToastMessage = {
  id: string;
  message: string;
  submessage?: string;
};

type ToastProps = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg shadow-emerald-900/10 animate-slide-in dark:border-emerald-800 dark:bg-slate-900 dark:shadow-emerald-950/30">
      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{toast.message}</p>
        {toast.submessage && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{toast.submessage}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
