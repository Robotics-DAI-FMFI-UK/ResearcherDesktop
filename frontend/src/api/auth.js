import client from './client'

export const loginApi = (username, password) =>
  client.post('/auth/login', { username, password })

export const registerApi = (username, password, confirmPassword) =>
  client.post('/auth/register', { username, password, confirmPassword })
