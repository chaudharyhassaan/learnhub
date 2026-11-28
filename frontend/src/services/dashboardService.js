import api from './api'

export async function getReviews(id) {
  const { data } = await api.get(`/courses/${id}/reviews`)
  return data
}

export async function saveReview(id, review) {
  const { data } = await api.post(`/courses/${id}/reviews`, review)
  return data
}

export async function sendHeartbeat(courseId, seconds) {
  const { data } = await api.patch(`/my-courses/${courseId}/heartbeat`, { seconds })
  return data
}

export async function getInstructorOverview() {
  const { data } = await api.get('/instructor/overview')
  return data
}

export async function getTracking(courseId) {
  const { data } = await api.get('/instructor/tracking', { params: { courseId } })
  return data
}

export async function getInstructorStudents(courseId) {
  const { data } = await api.get('/instructor/students', { params: { courseId } })
  return data
}

export async function searchDashboard(q, signal) {
  const { data } = await api.get('/search', { params: { q }, signal })
  return data
}

export async function getEvents(from, to) {
  const { data } = await api.get('/events', { params: { from, to } })
  return data
}

export async function createEvent(event) {
  const { data } = await api.post('/events', event)
  return data
}

export async function updateEvent(id, event) {
  const { data } = await api.put(`/events/${id}`, event)
  return data
}

export async function deleteEvent(id) {
  const { data } = await api.delete(`/events/${id}`)
  return data
}

export async function getGroups() {
  const { data } = await api.get('/groups')
  return data
}

export async function getMyGroups() {
  const { data } = await api.get('/my-groups')
  return data
}

export async function createGroup(group) {
  const { data } = await api.post('/groups', group)
  return data
}

export async function updateGroup(id, group) {
  const { data } = await api.put(`/groups/${id}`, group)
  return data
}

export async function deleteGroup(id) {
  const { data } = await api.delete(`/groups/${id}`)
  return data
}

export async function addGroupMember(id, studentId) {
  const { data } = await api.post(`/groups/${id}/members`, { studentId })
  return data
}

export async function removeGroupMember(id, studentId) {
  const { data } = await api.delete(`/groups/${id}/members/${studentId}`)
  return data
}

export async function sendMessage(recipientId, body) {
  const { data } = await api.post('/messages', { recipientId, body })
  return data
}

export async function getContacts() {
  const { data } = await api.get('/messages/contacts')
  return data
}

export async function getConversations() {
  const { data } = await api.get('/messages/conversations')
  return data
}

export async function getThread(userId) {
  const { data } = await api.get(`/messages/with/${userId}`)
  return data
}

export async function getNotifications() {
  const { data } = await api.get('/notifications')
  return data
}

export async function readAllNotifications() {
  const { data } = await api.patch('/notifications/read-all')
  return data
}

export async function readNotification(id) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function getEvaluations() {
  const { data } = await api.get('/evaluations')
  return data
}

export async function saveEvaluation(evaluation) {
  const { data } = await api.put('/evaluations', evaluation)
  return data
}

export async function getLearningPaths() {
  const { data } = await api.get('/learning-paths')
  return data
}

export async function getLearningPath(id) {
  const { data } = await api.get(`/learning-paths/${id}`)
  return data
}

export async function createLearningPath(path) {
  const { data } = await api.post('/learning-paths', path)
  return data
}

export async function updateLearningPath(id, path) {
  const { data } = await api.put(`/learning-paths/${id}`, path)
  return data
}

export async function deleteLearningPath(id) {
  const { data } = await api.delete(`/learning-paths/${id}`)
  return data
}

export async function updateProfile(profile) {
  const { data } = await api.put('/me', profile)
  return data
}

export async function updatePassword(passwords) {
  const { data } = await api.put('/me/password', passwords)
  return data
}
