import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, type, message }]);

        // Auto dismiss after 3.5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-rose-600 shrink-0" aria-hidden="true" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />;
            default:
                return <Info className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />;
        }
    };

    const getStyle = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'bg-white/95 border-emerald-200 text-emerald-950 shadow-emerald-500/10';
            case 'error':
                return 'bg-white/95 border-rose-200 text-rose-950 shadow-rose-500/10';
            case 'warning':
                return 'bg-white/95 border-amber-200 text-amber-950 shadow-amber-500/10';
            default:
                return 'bg-white/95 border-blue-200 text-blue-950 shadow-blue-500/10';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container: Responsive Top-Center on Mobile, Bottom-Right on Desktop */}
            <div
                className="fixed top-4 left-4 right-4 sm:top-auto sm:left-auto sm:right-6 sm:bottom-6 z-[9999] flex flex-col items-center sm:items-end space-y-2 pointer-events-none"
                role="status"
                aria-live="polite"
            >
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border backdrop-blur-md shadow-xl sm:shadow-2xl transition-all duration-300 w-full max-w-sm sm:max-w-md ${getStyle(
                            toast.type
                        )}`}
                    >
                        {getIcon(toast.type)}
                        <p className="text-xs sm:text-sm font-semibold tracking-tight leading-snug flex-1 select-none">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className="p-1 -mr-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100/50 transition-colors shrink-0"
                            aria-label="Tutup notifikasi"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export default ToastProvider;
