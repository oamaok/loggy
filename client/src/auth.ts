import state from './state'
import * as api from './api'
import { withLoadingSpinner } from './Loader'

const refreshAuthState = async (
  authToken = localStorage.getItem('auth-token')
) => {
  if (authToken) {
    const { token } = await api.getFreshToken(authToken)
    if (token) {
      localStorage.setItem('auth-token', token)
      if (state.auth.type !== 'authenticated') {
        state.auth = { type: 'authenticated', token }
      }
    } else {
      localStorage.removeItem('auth-token')
      if (state.auth.type !== 'unauthenticated') {
        state.auth = { type: 'unauthenticated' }
      }
    }
  } else {
    if (state.auth.type !== 'unauthenticated') {
      state.auth = { type: 'unauthenticated' }
    }
  }
}

export const login = async (email: string, password: string) => {
  try {
    await withLoadingSpinner(async () => {
      const { token } = await api.login(email, password)
      await refreshAuthState(token)
    })
  } catch (err) {
    console.error(err)
  }
}

export const logout = () => {
  state.auth = { type: 'unauthenticated' }
  localStorage.removeItem('auth-token')
}

export const createAccount = async (email: string, password: string) => {
  try {
    const { token } = await api.createAccount(email, password)
    await refreshAuthState(token)
  } catch (err) {
    console.error(err)
  }
}

withLoadingSpinner(refreshAuthState)

/*
window.addEventListener('blur', () => {
  // Effectively log out the user
  state.auth = { type: 'init' }
})

window.addEventListener('focus', () => {
  withLoadingSpinner(refreshAuthState)
})
*/
setInterval(refreshAuthState, 1000 * 60 * 15)
