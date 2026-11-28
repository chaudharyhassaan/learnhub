import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import getErrorMessage from '../../utils/getErrorMessage'

// Show API validation beside editable fields and keep failed drafts open.
export default function useDashboardAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()
  async function run(action, success, onSuccess) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const data = await action()
      onSuccess?.(data)
      if (success) toast.success(success)
    } catch (failure) {
      const message = getErrorMessage(failure)
      setError(message)
      toast.error(message.message)
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, fields: error?.fieldErrors || {}, run }
}
