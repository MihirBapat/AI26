/**
 * Centralized API Client for backend communication.
 * Handles base URL configuration, credentials (cookies), authorization headers, and error parsing.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export interface ApiError {
  status: number
  message: string
  detail?: string
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`


  const token = localStorage.getItem('access_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Includes HTTPOnly cookies for cross-origin / dev environments
  }

  try {
    const response = await fetch(url, config)

    if (response.status === 204) {
      return {} as T
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errorMessage = data.detail || data.message || `Request failed with status ${response.status}`
      const error: ApiError = {
        status: response.status,
        message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
      }
      throw error
    }

    return data as T
  } catch (err: any) {
    if (err.status) {
      throw err
    }
    throw {
      status: 500,
      message: err.message || 'Network error or backend service unavailable.',
    } as ApiError
  }
}
