import axios from 'axios'
import api from './api'

export async function getLessons(courseId) {
  const response = await api.get(`/courses/${courseId}/lessons`)
  return response.data
}

export async function createLesson(courseId, formData, onUploadProgress) {
  const response = await api.post(`/courses/${courseId}/lessons`, formData, { onUploadProgress })
  return response.data
}

export async function getLessonAccess(id) {
  const response = await api.get(`/lessons/${id}/access`)
  return response.data
}

export async function deleteLesson(id) {
  const response = await api.delete(`/lessons/${id}`)
  return response.data
}

// Signed file URLs already include /api and can be opened directly by the browser.
export function getFileUrl(filePath) {
  const apiBase = new URL(api.defaults.baseURL, window.location.origin)
  return new URL(filePath, apiBase.origin).href
}

export async function getFile(token) {
  const response = await axios.get(getFileUrl(`/api/files/${encodeURIComponent(token)}`), {
    responseType: 'blob',
  })
  return response.data
}
