import client from './client'

export const loginApi = (username, password) =>
  client.post('/api/auth/login', { username, password })

export const registerApi = (username, email, password, confirmPassword) =>
  client.post('/api/auth/register', { username, email, password, confirmPassword })

export const resetRequestApi = (username, email) =>
  client.post('/api/auth/reset-request', { username, email })

export const resetConfirmApi = (token, newPassword) =>
  client.post('/api/auth/reset-confirm', { token, newPassword })
