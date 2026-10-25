import { createContext, useCallback, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

const ToastContext = createContext<{ show: (msg: string, type?: ToastType) => void }>({
  show: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              padding: '10px 18px',
              marginBottom: 8,
              borderRadius: 8,
              background:
                t.type === 'success' ? '#2e7d32' : t.type === 'error' ? '#c62828' : '#333',
              color: '#fff',
              fontSize: 14,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              pointerEvents: 'auto',
              maxWidth: '90vw',
              wordBreak: 'break-word',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}