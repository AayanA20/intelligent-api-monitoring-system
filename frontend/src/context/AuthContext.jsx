import { createContext, useContext, useEffect, useState } from 'react'
import * as API from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const saved = localStorage.getItem('apg_user')

  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      setUser(parsed)
    } catch (err) {
      // 💥 Old invalid data (like "admin")
      console.warn('Invalid stored user, clearing...')
      localStorage.removeItem('apg_user')
    }
  }

  setLoading(false)
}, [])

  // 🔐 LOGIN
  const login = async (username, password) => {
    // ADMIN (hardcoded)
    if (username === 'admin' && password === 'password') {
      const userData = { username: 'admin', role: 'admin' }
      localStorage.setItem('apg_user', JSON.stringify(userData))
      setUser(userData)
      return userData
    }

    // NORMAL USER (backend)
    const data = await API.login(username, password)

    const userData = {
      username: data.username,
      role: 'user'
    }

    localStorage.setItem('apg_user', JSON.stringify(userData))
    setUser(userData)

    return data
  }

  // 📝 REGISTER
  const register = async (name, username, email, password) => {
    const data = await API.register(name, username, email, password)

    const userData = {
      username: data.username,
      role: 'user'
    }

    localStorage.setItem('apg_user', JSON.stringify(userData))
    setUser(userData)

    return data
  }

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem('apg_user')
    localStorage.removeItem('apg_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)