import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { apiRequest } from './api'
import type { ApiError } from './api'
import { store, useAppDispatch } from '../store'
import { logout as logoutAction } from '../store/authSlice'
import { loginThunk, refreshTokenThunk } from '../store/authThunks'
import type { AuthUser } from './types'

const selectUser = (state: { auth: { user: AuthUser | null } }) => state.auth.user
const selectLoaded = (state: { auth: { loaded: boolean } }) => state.auth.loaded

export function useAuth() {
  const dispatch = useAppDispatch()
  const user = useSelector(selectUser)
  const loaded = useSelector(selectLoaded)

  const login = useCallback(
    async (email: string, password: string) => {
      await dispatch(loginThunk(email, password))
    },
    [dispatch]
  )

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>('/api/auth/logout', { method: 'POST' })
    } finally {
      dispatch(logoutAction())
    }
  }, [dispatch])

  const authedRequest = useCallback(
    async <T,>(
      path: string,
      options?: Omit<Parameters<typeof apiRequest<T>>[1], 'token'>
    ): Promise<T> => {
      const currentUser = store.getState().auth.user
      if (!currentUser) {
        const err: ApiError = { status: 401, message: 'Not authenticated' }
        throw err
      }

      try {
        return await apiRequest<T>(path, options ?? {})
      } catch (e) {
        const err = e as ApiError
        if (err.status !== 401) throw err

        try {
          await dispatch(refreshTokenThunk())
        } catch {
          throw err
        }
        return await apiRequest<T>(path, options ?? {})
      }
    },
    [dispatch]
  )

  return { user, role: user?.role ?? null, loaded, login, logout, authedRequest }
}
