import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { apiFetch } from '@/lib/api'

export type UserRole = 'gov' | 'provider' | 'employer' | 'candidate'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login?: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (full_name: string, email: string, password: string, role: UserRole) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const checkAuthStatus = async () => {
    setIsLoading(true)
    try {
      const userData = await apiFetch<User>('/auth/me')
      setUser(userData)
    } catch {
      setUser(null)
      localStorage.removeItem('access_token')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
    }
    setUser(data.user)
    return data.user
  }

  const register = async (
    full_name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<User> => {
    const data = await apiFetch<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, role }),
    })

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
    }
    setUser(data.user)
    return data.user
  }

  const logout = async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // Continue client cleanup even if network request fails
    } finally {
      localStorage.removeItem('access_token')
      setUser(null)
    }
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
