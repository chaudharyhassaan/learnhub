import { useId } from 'react'

// Keep feedback attached to its input even when the same form appears twice.
export default function FormField({ id, label, hint, error, action, as: Control = 'input', children, ...props }) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const descriptions = [props['aria-describedby'], hint && fieldId + '-hint', error && fieldId + '-error']
  return (
    <div className="lh-field">
      <label className="form-label" htmlFor={fieldId}>{label}</label>
      <div className="lh-input-row">
        <Control {...props} id={fieldId} className={Control === 'select' ? 'form-select' : 'form-control'}
          aria-invalid={error ? true : undefined} aria-describedby={descriptions.filter(Boolean).join(' ') || undefined}>
          {children}
        </Control>
        {action}
      </div>
      {hint && <p id={fieldId + '-hint'}>{hint}</p>}
      {error && <p id={fieldId + '-error'} className="lh-error" role="alert">{error}</p>}
    </div>
  )
}
