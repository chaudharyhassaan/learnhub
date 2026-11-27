import { createContext, useContext, useRef, useState } from 'react'
import Toast from 'react-bootstrap/Toast'

const ToastContext = createContext(null)

// Separate IDs and timers let consecutive messages close independently.
export function ToastProvider({ children }) {
  const [messages, setMessages] = useState([])
  const sequence = useRef(0)
  function notify(type, message) {
    const id = ++sequence.current
    setMessages(current => [...current, { id, type, message }])
  }
  function dismiss(id) {
    setMessages(current => current.filter(item => item.id !== id))
  }
  return <ToastContext.Provider value={{
    success: message => notify('success', message),
    error: message => notify('error', message),
  }}>
    {children}
    <div className="lh-toasts" aria-live="polite" aria-relevant="additions">
      {messages.map(item => <Toast key={item.id} role="status" aria-live="polite" delay={5000} autohide onClose={() => dismiss(item.id)}>
        <Toast.Header><strong className={'me-auto lh-' + item.type}>{item.type === 'success' ? 'Success' : 'Error'}</strong></Toast.Header>
        <Toast.Body>{item.message}</Toast.Body>
      </Toast>)}
    </div>
  </ToastContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useToast() { return useContext(ToastContext) }
