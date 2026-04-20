import { createContext, useContext, useState } from 'react'
import client from '../../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const [mode, setMode] = useState(() => {
    return localStorage.getItem('mode') || 'BASIC'
  })

  function login(token, username, role, userMode = 'BASIC') {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify({ username, role }))
    localStorage.setItem('mode', userMode)
    setUser({ username, role })
    setMode(userMode)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('mode')
    setUser(null)
    setMode('BASIC')
  }

  async function updateMode(newMode) {
    const { data } = await client.put('/auth/me/mode', { mode: newMode })
    localStorage.setItem('token', data.token)
    localStorage.setItem('mode', data.mode)
    setMode(data.mode)
  }

  return (
    <AuthContext.Provider value={{ user, mode, login, logout, updateMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
