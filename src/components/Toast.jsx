import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { X, RotateCcw } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current)
    setToast(null)
  }, [])

  const showToast = useCallback((message, undoFn = null) => {
    clearTimeout(timerRef.current)
    setToast({ message, undoFn, id: Date.now() })
    timerRef.current = setTimeout(() => setToast(null), 5000)
  }, [])

  const handleUndo = useCallback(() => {
    clearTimeout(timerRef.current)
    toast?.undoFn?.()
    setToast(null)
  }, [toast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          hasUndo={!!toast.undoFn}
          onUndo={handleUndo}
          onDismiss={dismiss}
        />
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

function Toast({ message, hasUndo, onUndo, onDismiss }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const tick = 50
    const steps = 5000 / tick
    const decrement = 100 / steps
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p - decrement
        if (next <= 0) { clearInterval(interval); return 0 }
        return next
      })
    }, tick)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 z-50 w-[calc(100vw-2.5rem)] sm:w-auto sm:min-w-72 sm:max-w-sm">
      <div className="bg-[var(--primary)] text-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 pt-3 pb-2">
          <p className="text-sm font-medium leading-snug">{message}</p>
          <div className="flex items-center gap-1 shrink-0">
            {hasUndo && (
              <button
                onClick={onUndo}
                className="flex items-center gap-1 text-xs font-semibold bg-white/15 hover:bg-white/25 transition-colors px-2.5 py-1.5 rounded-lg"
              >
                <RotateCcw size={12} />
                Deshacer
              </button>
            )}
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-white/15">
          <div
            className="h-full bg-[var(--accent)] transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
