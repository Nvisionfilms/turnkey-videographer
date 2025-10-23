import { Toast, ToastClose, ToastDescription, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"

function ToastItem({ id, title, description, action, onDismiss, ...props }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  // Start fade at 1.5 seconds, remove at 2.5 seconds
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 1500)
    
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      onDismiss(id)
    }, 2500)
    
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [id, onDismiss])

  const handleClose = () => {
    setIsFading(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss(id)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div style={{ 
      opacity: isFading ? 0 : 1,
      transition: 'opacity 1s ease-out'
    }}>
      <Toast {...props}>
        <div className="grid gap-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
        {action}
        <ToastClose onClick={handleClose} />
      </Toast>
    </div>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastViewport 
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: 'auto',
        minWidth: '420px',
        maxWidth: '500px',
        margin: 0,
        padding: 0
      }}
    >
      {toasts.map(function (toast) {
        return <ToastItem key={toast.id} {...toast} onDismiss={dismiss} />
      })}
    </ToastViewport>
  )
}