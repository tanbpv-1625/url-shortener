/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  message: string
  type?: 'success' | 'error'
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 300) // wait for fade-out animation
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(handleClose, duration)
    return () => clearTimeout(timer)
  }, [duration, handleClose])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all duration-300',
        'min-h-touch flex items-center gap-2',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        type === 'success' && 'bg-green-600 text-white',
        type === 'error' && 'bg-red-600 text-white',
      )}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={handleClose}
        className="ml-2 text-white/80 hover:text-white min-h-touch min-w-touch flex items-center justify-center"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}

// Toast context for global usage
import { createContext, useContext, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  )
}
