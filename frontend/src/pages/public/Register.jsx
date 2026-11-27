import usePageTitle from '../../utils/usePageTitle'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../../components/common/AuthCard'
import FormField from '../../components/common/FormField'
import PasswordField from '../../components/common/PasswordField'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import getErrorMessage from '../../utils/getErrorMessage'
import useAuthForm from './useAuthForm'

const fields = ['name', 'email', 'password', 'role']
const duplicateEmail = <>An account with this email already exists. <Link to="/login">Try logging in.</Link></>

function validateField(name, value) {
  if (name === 'name' && (value.trim().length < 2 || value.trim().length > 60)) return 'Use 2 to 60 characters.'
  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.'
  if (name === 'password' && (value.length < 8 || !/[A-Za-z]/.test(value) || !/[0-9]/.test(value))) {
    return 'Use at least 8 characters with a letter and a number.'
  }
  if (name === 'role' && !['student', 'instructor'].includes(value)) return 'Choose Learn or Teach.'
  return ''
}

// Validate on blur for quick feedback and again before submitting to the API.
export default function Register() {
  usePageTitle('Sign up')
  const { register } = useAuth()
  const toast = useToast()
  const { formRef, errors, setErrors, showErrors } = useAuthForm(fields)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  function validateOnBlur(event) {
    const { name, value } = event.currentTarget
    if (name === 'email' && errors.email === duplicateEmail) return
    setErrors(current => ({ ...current, [name]: validateField(name, value) }))
  }

  function clearDuplicateEmail() {
    if (errors.email === duplicateEmail) setErrors(current => ({ ...current, email: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (sending) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const validation = Object.fromEntries(fields.map(name => [name, validateField(name, values[name])]))
    setMessage('')
    showErrors(validation)
    if (Object.values(validation).some(Boolean)) return

    setSending(true)
    try {
      await register({ ...values, name: values.name.trim(), email: values.email.trim() })
      toast.success('Your account is ready.')
    } catch (error) {
      const { message, fieldErrors } = getErrorMessage(error)
      if (error.response?.status === 409) showErrors({ email: duplicateEmail })
      else if (Object.keys(fieldErrors).length) showErrors(fieldErrors)
      else setMessage(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthCard register>
      <form noValidate ref={formRef} onSubmit={submit}>
        <FormField label="Name" name="name" autoComplete="name" required disabled={sending}
          error={errors.name} onBlur={validateOnBlur} />
        <FormField label="Email" name="email" type="email" autoComplete="email" required
          disabled={sending} error={errors.email} onBlur={validateOnBlur} onChange={clearDuplicateEmail} />
        <PasswordField name="password" autoComplete="new-password" required
          hint="At least 8 characters with a letter and a number" disabled={sending}
          error={errors.password} onBlur={validateOnBlur} />
        <fieldset className="lh-auth-roles" disabled={sending} aria-describedby={errors.role ? 'role-error' : undefined}>
          <legend>I want to</legend>
          <label><input type="radio" name="role" value="student" defaultChecked />Learn (student)</label>
          <label><input type="radio" name="role" value="instructor" />Teach (instructor)</label>
          {errors.role && <p className="lh-error" id="role-error" role="alert">{errors.role}</p>}
        </fieldset>
        {message && <p className="lh-error lh-auth-message" role="alert">{message}</p>}
        <button className="btn btn-primary lh-auth-submit" type="submit" disabled={sending} aria-busy={sending}>
          {sending ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  )
}
