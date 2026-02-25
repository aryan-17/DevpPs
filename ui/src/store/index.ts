import { configureStore } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import { authSlice } from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
