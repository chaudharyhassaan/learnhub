import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'
import { tokenKey } from '../services/api'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import getErrorMessage from '../utils/getErrorMessage'

const AuthContext = createContext(null)

// Restore the user from the API before the router makes a role decision.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    async function restoreSession() {
      try {
        if (localStorage.getItem(tokenKey)) {
          const data = await authService.getMe()
          if (active) setUser(data.user)
        }
      } catch (failure) {
        if (active && failure.response?.status !== 401) setError(getErrorMessage(failure).message)
      } finally {
        if (active) setLoading(false)
      }
    }
    restoreSession()
    return () => { active = false }
  }, [attempt])

  function retry() {
    setLoading(true)
    setError('')
    setAttempt(current => current + 1)
  }

  function saveSession({ token, user }) {
    localStorage.setItem(tokenKey, token)
    setUser(user)
    return user
  }

  async function login(credentials) {
    return saveSession(await authService.login(credentials))
  }

  async function register(details) {
    return saveSession(await authService.register(details))
  }

  function logout() {
    localStorage.removeItem(tokenKey)
    setUser(null)
  }

  if (loading || error) return (
    <main className="container-narrow section">
      {loading ? <LoadingState /> : <ErrorState message={error} onRetry={retry} />}
    </main>
  )
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
