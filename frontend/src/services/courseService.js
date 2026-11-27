import api from './api'

export async function getHealth() {
  const response = await api.get('/health')
  return response.data
}

export async function getStats() {
  const response = await api.get('/stats')
  return response.data
}

export async function getCategories() {
  const response = await api.get('/categories')
  return response.data
}

export async function getCourses(params) {
  const response = await api.get('/courses', { params })
  return response.data
}

export async function getMyCourses() {
  const response = await api.get('/courses/mine')
  return response.data
}

export async function getCourse(id) {
  const response = await api.get(`/courses/${id}`)
  return response.data
}

export async function createCourse(course) {
  const response = await api.post('/courses', course)
  return response.data
}

export async function updateCourse(id, course) {
  const response = await api.put(`/courses/${id}`, course)
  return response.data
}

export async function deleteCourse(id) {
  const response = await api.delete(`/courses/${id}`)
  return response.data
}
