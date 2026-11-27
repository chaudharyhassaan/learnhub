import { useState } from 'react'
import { Eye, EyeSlash } from 'react-bootstrap-icons'
import FormField from './FormField'

// Toggling visibility keeps the same input and preserves its value.
export default function PasswordField({ label = 'Password', ...props }) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeSlash : Eye
  return <FormField {...props} label={label} type={visible ? 'text' : 'password'} action={
    <button type="button" className="btn btn-outline-primary" disabled={props.disabled}
      aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>
      <Icon aria-hidden="true" />
    </button>
  } />
}
