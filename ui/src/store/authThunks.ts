import type { AppDispatch } from './index'
import { apiRequest } from '../lib/api'
import type { AuthUser } from '../lib/types'
import { setUser } from './authSlice'

export function loginThunk(email: string, password: string) {
  return async (dispatch: AppDispatch) => {
    const user = await apiRequest<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    dispatch(setUser(user))
  }
}

export function refreshTokenThunk() {
  return async (dispatch: AppDispatch) => {
    const user = await apiRequest<AuthUser>('/api/auth/refresh', {
      method: 'POST',
    })
    dispatch(setUser(user))
    return user
  }
}

export function fetchUserThunk() {
  return async (dispatch: AppDispatch) => {
    try {
      const user = await apiRequest<AuthUser>('/api/auth/me')
      dispatch(setUser(user))
      return user
    } catch {
      dispatch(setUser(null))
      return null
    }
  }
}
