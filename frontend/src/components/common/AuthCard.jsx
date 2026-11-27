import { Link } from 'react-router-dom'
import Wordmark from '../layout/Wordmark'
import '../../styles/auth.css'

// Both forms share the same layout and place the switch panel first on mobile.
export default function AuthCard({ register = false, children }) {
  return (
    <div className={`card lh-auth-card${register ? ' lh-auth-register' : ''}`}>
      <div className="lh-auth-form">
        <Wordmark />
        <h1 className="page-title">{register ? 'Sign up' : 'Log in'}</h1>
        {children}
      </div>
      <aside className="lh-auth-panel">
        <h2>{register ? 'Welcome back' : 'New here?'}</h2>
        <p>{register ? 'Log in to continue your courses.' : 'Create an account to enroll in courses.'}</p>
        <Link className="btn btn-outline-primary" to={register ? '/login' : '/register'}>
          {register ? 'Log in' : 'Sign up'}
        </Link>
      </aside>
    </div>
  )
}
