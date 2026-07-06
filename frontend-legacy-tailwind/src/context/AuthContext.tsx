import React, { createContext, useCallback, useEffect, useState } from 'react'
import type { AuthResponse, UserResponse } from '../types'

interface AuthContextValue {
  currentUser: UserResponse | null
  token: string | null
  isLoading: boolean
  login: (res: AuthResponse) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]           = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading]   = useState(true)

  // Restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('ss_token')
    const storedUser  = localStorage.getItem('ss_user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setCurrentUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('ss_token')
        localStorage.removeItem('ss_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((res: AuthResponse) => {
    const user: UserResponse = {
      id: res.id,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
      plan: res.plan,
    }
    localStorage.setItem('ss_token', res.token)
    localStorage.setItem('ss_user', JSON.stringify(user))
    setToken(res.token)
    setCurrentUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ss_token')
    localStorage.removeItem('ss_user')
    setToken(null)
    setCurrentUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
