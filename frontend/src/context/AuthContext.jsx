import { createContext, useContext, useEffect, useState } from 'react'
import * as API from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('apg_token')
    const saved = localStorage.getItem('apg_user')
    if (token && saved) {
      setUser({ username: saved })
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const data = await API.login(username, password)
    localStorage.setItem('apg_token', data.token)
    localStorage.setItem('apg_user', data.username)
    setUser({ username: data.username })
    return data
  }

  const register = async (username, password) => {
    const data = await API.register(username, password)
    localStorage.setItem('apg_token', data.token)
    localStorage.setItem('apg_user', data.username)
    setUser({ username: data.username })
    return data
  }

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