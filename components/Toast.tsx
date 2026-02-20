import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transform transition-all duration-300 animate-in slide-in-from-right-full
              ${toast.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-100' : ''}
              ${toast.type === 'error' ? 'bg-red-900/80 border-red-500/30 text-red-100' : ''}
              ${toast.type === 'warning' ? 'bg-amber-900/80 border-amber-500/30 text-amber-100' : ''}
              ${toast.type === 'info' ? 'bg-blue-900/80 border-blue-500/30 text-blue-100' : ''}
            `}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-400" />}
                        {toast.type === 'error' && <AlertCircle size={20} className="text-red-400" />}
                        {toast.type === 'warning' && <AlertTriangle size={20} className="text-amber-400" />}
                        {toast.type === 'info' && <Info size={20} className="text-blue-400" />}

                        <p className="text-sm font-medium pr-8">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={14} className="opacity-60 hover:opacity-100" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
