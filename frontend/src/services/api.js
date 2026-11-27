import axios from 'axios'

export const tokenKey = 'learnhub_token'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Keep failed sign-in attempts on the form. Other 401s end the expired session.
api.interceptors.response.use((response) => response, (error) => {
  const { config, response } = error
  const isFormRequest = ['/login', '/register'].includes(config?.url)
  const token = localStorage.getItem(tokenKey)
  const currentSession = !token || config?.headers?.Authorization === `Bearer ${token}`
  if (response?.status === 401 && !isFormRequest && currentSession) {
    localStorage.removeItem(tokenKey)
    const { pathname, search, hash } = window.location
    if (!['/login', '/register'].includes(pathname)) {
      window.location.replace('/login?next=' + encodeURIComponent(pathname + search + hash))
    }
  }
  return Promise.reject(error)
})

export default api
