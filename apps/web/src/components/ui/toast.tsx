"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface Toast extends ToastOptions {
    id: string;
}

interface ToastContextType {
    toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}

const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const colors = {
    success: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    error: 'text-red-400 border-red-500/20 bg-red-500/10',
    info: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    warning: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((options: ToastOptions) => {
        const id = Math.random().toString(36).slice(2);
        const newToast: Toast = { ...options, id };
        setToasts(prev => [...prev, newToast]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, options.duration || 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => {
                        const variant = t.variant || 'info';
                        const Icon = icons[variant];
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                                className={`glass-strong rounded-lg p-4 flex items-start gap-3 shadow-xl ${colors[variant]}`}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                                    {t.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeToast(t.id)}
                                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
