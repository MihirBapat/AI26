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

export interface OtpChallenge {
  requires_otp: true
  email: string
  temp_token: string
  message: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<OtpChallenge>
  register: (full_name: string, email: string, password: string, role: UserRole) => Promise<OtpChallenge>
  verifyOtp: (email: string, otp: string, temp_token: string, purpose?: string) => Promise<User>
  resendOtp: (email: string, temp_token: string, purpose?: string) => Promise<OtpChallenge>
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

  const login = async (email: string, password: string): Promise<OtpChallenge> => {
    const data = await apiFetch<OtpChallenge>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return data
  }

  const register = async (
    full_name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<OtpChallenge> => {
    const data = await apiFetch<OtpChallenge>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, role }),
    })
    return data
  }

  const verifyOtp = async (
    email: string,
    otp: string,
    temp_token: string,
    purpose: string = 'login'
  ): Promise<User> => {
    const data = await apiFetch<TokenResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, temp_token, purpose }),
    })

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
    }
    setUser(data.user)
    return data.user
  }

  const resendOtp = async (
    email: string,
    temp_token: string,
    purpose: string = 'login'
  ): Promise<OtpChallenge> => {
    const data = await apiFetch<OtpChallenge>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, temp_token, purpose }),
    })
    return data
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
        verifyOtp,
        resendOtp,
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
