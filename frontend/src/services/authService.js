import api from './api'

export async function login(credentials) {
  const response = await api.post('/login', credentials)
  return response.data
}

export async function register(details) {
  const response = await api.post('/register', details)
  return response.data
}

export async function getMe() {
  const response = await api.get('/me')
  return response.data
}
