import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import DashboardFrame from './DashboardFrame'

const titles = [
  ['/dashboard/admin', 'Overview'], ['/dashboard/admin/users', 'Users'], ['/dashboard/admin/courses', 'Courses'],
  ['/dashboard/student/courses', 'My courses'], ['/learn/:courseId', 'Lesson viewer'],
  ['/dashboard/instructor/courses', 'My courses'], ['/dashboard/instructor/courses/new', 'Create course'],
  ['/dashboard/instructor/courses/:id/edit', 'Edit course'],
]

// Use the authenticated user for navigation and the current route for the top bar.
export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const title = titles.find(([path]) => matchPath(path, pathname))?.[1] || 'Dashboard'
  function signOut() {
    logout()
    window.location.replace('/')
  }
  return <DashboardFrame user={user} title={title} onLogout={signOut}><Outlet /></DashboardFrame>
}
