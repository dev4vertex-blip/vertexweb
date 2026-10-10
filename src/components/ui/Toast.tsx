import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage } from '../../types';

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const type = toast.type || 'info';
  const detailText = toast.description || toast.message;

  return (
    <div className="pointer-events-auto flex items-start gap-3 p-3.5 bg-white rounded-xl shadow-lg border border-slate-200 animate-in slide-in-from-bottom-2 fade-in">
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-bold text-slate-900">{toast.title}</h5>
        {detailText && (
          <p className="mt-0.5 text-xs text-slate-500 leading-snug">{detailText}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
