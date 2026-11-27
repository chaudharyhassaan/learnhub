import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import getErrorMessage from '../../utils/getErrorMessage'

// Refresh only after successful deletion and show the API's reason on failure.
export default function useAdminDelete(remove, successMessage, onRemoved) {
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  async function confirm() {
    if (!selected || deleting) return
    setDeleting(true)
    try {
      await remove(selected._id)
      onRemoved()
      toast.success(successMessage)
    } catch (error) {
      toast.error(getErrorMessage(error).message)
    } finally {
      setDeleting(false)
      setSelected(null)
    }
  }

  return { selected, setSelected, deleting, confirm }
}
