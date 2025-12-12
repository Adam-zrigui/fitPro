'use client'

import { useEffect } from 'react'

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 5000,
}: {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose?: () => void
  duration?: number
}) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-700'

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm w-full ${bg} text-white rounded-lg shadow-lg`} role="status">
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={() => onClose && onClose()} className="opacity-90 hover:opacity-100 text-white">
          ✕
        </button>
      </div>
    </div>
  )
}
