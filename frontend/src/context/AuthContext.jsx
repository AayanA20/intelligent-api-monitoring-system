import { createContext, useContext, useEffect, useState } from 'react'
import * as API from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on first load
  useEffect(() => {
    const saved = localStorage.getItem('apg_user')
    const token = localStorage.getItem('apg_token')

    if (saved && token) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
      } catch {
        // Old/corrupt entry — clear it
        localStorage.removeItem('apg_user')
        localStorage.removeItem('apg_token')
      }
    }
    setLoading(false)
  }, [])

  // 🔐 LOGIN — backend tells us role + issues JWT
  const login = async (username, password) => {
    const data = await API.login(username, password)

    const userData = {
      username: data.username,
      role:     data.role || 'user',
      name:     data.name || data.username,
    }

    localStorage.setItem('apg_token', data.token)
    localStorage.setItem('apg_user',  JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  // 📝 REGISTER — always becomes a normal user
  const register = async (name, username, email, password) => {
    const data = await API.register(name, username, email, password)

    const userData = {
      username: data.username,
      role:     data.role || 'user',
      name:     data.name || name || username,
    }

    localStorage.setItem('apg_token', data.token)
    localStorage.setItem('apg_user',  JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem('apg_token')
    localStorage.removeItem('apg_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)