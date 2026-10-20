import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

function readSession() {
  return {
    access: localStorage.getItem('prospira.access'),
    refresh: localStorage.getItem('prospira.refresh'),
    username: localStorage.getItem('prospira.username'),
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  function saveSession(tokens, username) {
    localStorage.setItem('prospira.access', tokens.access)
    localStorage.setItem('prospira.refresh', tokens.refresh)
    localStorage.setItem('prospira.username', username)
    setSession({ access: tokens.access, refresh: tokens.refresh, username })
  }

  async function login(credentials) {
    const tokens = await authApi.login(credentials)
    saveSession(tokens, credentials.username)
  }

  async function register(details) {
    await authApi.register(details)
    await login({ username: details.username, password: details.password })
  }

  function logout() {
    localStorage.removeItem('prospira.access')
    localStorage.removeItem('prospira.refresh')
    localStorage.removeItem('prospira.username')
    setSession({ access: null, refresh: null, username: null })
  }

  useEffect(() => {
    window.addEventListener('prospira:session-expired', logout)
    return () => window.removeEventListener('prospira:session-expired', logout)
  }, [])

  return (
    <AuthContext.Provider value={{ ...session, isAuthenticated: Boolean(session.access), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
