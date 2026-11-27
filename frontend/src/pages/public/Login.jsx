import usePageTitle from '../../utils/usePageTitle'
import { useState } from 'react'
import AuthCard from '../../components/common/AuthCard'
import FormField from '../../components/common/FormField'
import PasswordField from '../../components/common/PasswordField'
import { useAuth } from '../../context/AuthContext'
import getErrorMessage from '../../utils/getErrorMessage'
import useAuthForm from './useAuthForm'

// GuestRoute resumes the protected destination once login restores the user.
export default function Login() {
  usePageTitle('Log in')
  const { login } = useAuth()
  const { formRef, errors, setErrors, showErrors } = useAuthForm(['email', 'password'])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (sending) return
    const form = new FormData(event.currentTarget)
    const email = form.get('email').trim()
    const password = form.get('password')
    setMessage('')
    if (!email || !password) {
      showErrors({
        email: email ? '' : 'Enter your email address.',
        password: password ? '' : 'Enter your password.',
      })
      return
    }
    setErrors({})
    setSending(true)
    try {
      await login({ email, password })
    } catch (error) {
      const { message, fieldErrors } = getErrorMessage(error)
      showErrors(fieldErrors)
      if (error.response?.status === 401) {
        setMessage('Invalid email or password. Check them and try again.')
      } else if (!Object.keys(fieldErrors).length) {
        setMessage(message)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthCard>
      <form noValidate ref={formRef} onSubmit={submit}>
        <FormField label="Email" name="email" type="email" autoComplete="email" required
          disabled={sending} error={errors.email} />
        <PasswordField name="password" autoComplete="current-password" required
          disabled={sending} error={errors.password} />
        {message && <p className="lh-error lh-auth-message" role="alert">{message}</p>}
        <button className="btn btn-primary lh-auth-submit" type="submit" disabled={sending} aria-busy={sending}>
          {sending ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </AuthCard>
  )
}
