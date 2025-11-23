import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const push = useCallback(({ title, description, variant = 'info', duration = 3000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, title, description, variant }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ push, remove }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              min-w-[300px] p-4 rounded-xl shadow-lg border-l-4 animate-slide-in
              ${toast.variant === 'success' ? 'bg-white border-green-500' :
                                toast.variant === 'error' ? 'bg-white border-red-500' :
                                    'bg-white border-blue-500'}
            `}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className={`font-bold text-sm ${toast.variant === 'success' ? 'text-green-700' :
                                        toast.variant === 'error' ? 'text-red-700' :
                                            'text-blue-700'
                                    }`}>
                                    {toast.title}
                                </h4>
                                {toast.description && (
                                    <p className="text-sm text-gray-600 mt-1">{toast.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => remove(toast.id)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
