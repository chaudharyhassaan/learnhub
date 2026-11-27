import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'
import { tokenKey } from '../services/api'

const AuthContext = createContext(null)

// Restore the user from the API before the router makes a role decision.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function restoreSession() {
      try {
        if (localStorage.getItem(tokenKey)) {
          const data = await authService.getMe()
          if (active) setUser(data.user)
        }
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    restoreSession()
    return () => { active = false }
  }, [])

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

  if (loading) return null
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
