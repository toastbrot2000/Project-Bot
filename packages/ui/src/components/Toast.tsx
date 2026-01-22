import * as React from "react"
import { createPortal } from "react-dom"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "../lib/utils"

export type ToastType = "success" | "error" | "info"

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void
    removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = React.useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const addToast = (message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(7)
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            removeToast(id)
        }, 5000)
    }

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={cn(
                                "flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg animate-in fade-in slide-in-from-right-full duration-300",
                                toast.type === "success" && "border-l-4 border-l-emerald-500",
                                toast.type === "error" && "border-l-4 border-l-red-500",
                                toast.type === "info" && "border-l-4 border-l-blue-500"
                            )}
                        >
                            {toast.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                            {toast.type === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                            {toast.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
                            <p className="text-sm font-medium">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-auto rounded-full p-1 hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    )
}
