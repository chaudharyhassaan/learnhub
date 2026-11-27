import api from './api'

export async function enroll(courseId) {
  const response = await api.post('/enroll', { courseId })
  return response.data
}

export async function getMyCourses() {
  const response = await api.get('/my-courses')
  return response.data
}

export async function getMyCourse(courseId) {
  const response = await api.get(`/my-courses/${courseId}`)
  return response.data
}

export async function updateLessonProgress(courseId, lessonId, completed) {
  const response = await api.patch(`/my-courses/${courseId}/lessons/${lessonId}`, { completed })
  return response.data
}
