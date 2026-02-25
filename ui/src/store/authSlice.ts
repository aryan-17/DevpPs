import { createSlice } from '@reduxjs/toolkit'
import type { AuthUser } from '../lib/types'

type AuthState = {
  user: AuthUser | null
  loaded: boolean
}

const initialState: AuthState = {
  user: null,
  loaded: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: { payload: AuthUser | null }) => {
      state.user = action.payload
      state.loaded = true
    },
    logout: (state) => {
      state.user = null
    },
  },
})

export const { setUser, logout } = authSlice.actions
