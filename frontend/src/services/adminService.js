import api from './api'

export async function getUsers(params) {
  const response = await api.get('/admin/users', { params })
  return response.data
}

export async function updateUserRole(id, role) {
  const response = await api.patch(`/admin/users/${id}/role`, { role })
  return response.data
}

export async function deleteUser(id) {
  const response = await api.delete(`/admin/users/${id}`)
  return response.data
}

export async function getAnalytics() {
  const response = await api.get('/admin/analytics')
  return response.data
}

export async function getAuditLogs() {
  const response = await api.get('/admin/audit-logs')
  return response.data
}
