import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    actions?: ToastAction[];
}

export interface ToastAction {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { ...toast, id };
        
        setToasts(prev => [...prev, newToast]);
        
        // Auto-remove toast after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
        
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((title: string, message = '', duration = 5000) => {
        return addToast({ type: 'success', title, message, duration });
    }, [addToast]);

    const error = useCallback((title: string, message = '', duration = 8000) => {
        return addToast({ type: 'error', title, message, duration });
    }, [addToast]);

    const warning = useCallback((title: string, message = '', duration = 6000) => {
        return addToast({ type: 'warning', title, message, duration });
    }, [addToast]);

    const info = useCallback((title: string, message = '', duration = 5000) => {
        return addToast({ type: 'info', title, message, duration });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{
            toasts,
            addToast,
            removeToast,
            success,
            error,
            warning,
            info
        }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle className="text-green-400" size={20} />;
            case 'error': return <AlertCircle className="text-red-400" size={20} />;
            case 'warning': return <AlertTriangle className="text-yellow-400" size={20} />;
            case 'info': return <Info className="text-blue-400" size={20} />;
        }
    };

    const getBackgroundColor = () => {
        switch (toast.type) {
            case 'success': return 'bg-green-900/20 border-green-700';
            case 'error': return 'bg-red-900/20 border-red-700';
            case 'warning': return 'bg-yellow-900/20 border-yellow-700';
            case 'info': return 'bg-blue-900/20 border-blue-700';
        }
    };

    return (
        <div className={`p-4 rounded-lg border backdrop-blur-sm ${getBackgroundColor()} animate-in slide-in-from-right duration-300`}>
            <div className="flex items-start gap-3">
                {getIcon()}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white">{toast.title}</h4>
                    {toast.message && (
                        <p className="text-sm text-gray-300 mt-1">{toast.message}</p>
                    )}
                    {toast.actions && toast.actions.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {toast.actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.action}
                                    className={`px-3 py-1 text-xs rounded transition-colors ${
                                        action.variant === 'primary'
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                    }`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onRemove(toast.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Close notification"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
