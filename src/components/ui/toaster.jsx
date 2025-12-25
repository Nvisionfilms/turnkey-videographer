import { Toast, ToastClose, ToastDescription, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"

function ToastItem({ id, title, description, action, onDismiss, variant, ...props }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  // Destructive toasts stay longer (5s), others dismiss at 2.5s
  const dismissTime = variant === 'destructive' ? 5000 : 2500
  const fadeTime = variant === 'destructive' ? 4000 : 1500

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, fadeTime)
    
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      onDismiss(id)
    }, dismissTime)
    
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [id, onDismiss, fadeTime, dismissTime])

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
        bottom: '20px',
        right: '20px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: 'auto',
        minWidth: '300px',
        maxWidth: '380px',
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