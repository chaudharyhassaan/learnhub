import { useEffect, useRef, useState } from 'react'

// Focus after the feedback is rendered and pending controls are enabled again.
export default function useAuthForm(fieldOrder) {
  const formRef = useRef(null)
  const [errors, setErrors] = useState({})
  const [focusRequest, setFocusRequest] = useState(null)

  useEffect(() => {
    if (focusRequest) {
      formRef.current?.querySelector(`[name="${focusRequest.field}"]`)?.focus()
    }
  }, [focusRequest])

  function showErrors(nextErrors) {
    setErrors(nextErrors)
    const field = fieldOrder.find(name => nextErrors[name])
    if (field) setFocusRequest({ field })
  }

  return { formRef, errors, setErrors, showErrors }
}
