import { Suspense } from 'react'
import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingState from '../common/LoadingState'
import DashboardFrame from './DashboardFrame'

const titles = [
  ['/dashboard/admin', 'Overview'], ['/dashboard/admin/users', 'Users'], ['/dashboard/admin/courses', 'Courses'],
  ['/dashboard/student/courses', 'My courses'], ['/learn/:courseId', 'Lesson viewer'],
  ['/dashboard/student/groups', 'My Groups'],
  ['/dashboard/instructor/courses', 'My courses'], ['/dashboard/instructor/courses/new', 'Create course'],
  ['/dashboard/instructor/courses/:id/edit', 'Edit course'],
  ['/dashboard/inbox', 'Inbox'], ['/dashboard/schedule', 'Schedule'],
  ['/dashboard/learning-paths', 'Learning Path'], ['/dashboard/settings', 'Settings'],
  ['/dashboard/help', 'Help & Support'], ['/dashboard/instructor/evaluate', 'Evaluate Students'],
  ['/dashboard/instructor/tracking/:tab', 'Tracking'], ['/dashboard/instructor/groups', 'Groups'],
]

// Use the authenticated user for navigation and the current route for the top bar.
export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const title = titles.find(([path]) => matchPath(path, pathname))?.[1] || 'Dashboard'
  const subtitle = pathname === '/dashboard/instructor'
    ? 'Your insights hub: track, manage and elevate your courses' : undefined
  function signOut() {
    logout()
    window.location.replace('/')
  }
  return <DashboardFrame user={user} title={title} subtitle={subtitle} onLogout={signOut}>
    <Suspense fallback={<LoadingState />}><Outlet /></Suspense>
  </DashboardFrame>
}
