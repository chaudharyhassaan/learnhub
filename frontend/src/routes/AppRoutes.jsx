import { lazy } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import PublicLayout from '../components/layout/PublicLayout'
import Home from '../pages/public/Home'
import Courses from '../pages/public/Courses'
import CourseDetail from '../pages/public/CourseDetail'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import NotFound from '../pages/public/NotFound'
import MyCourses from '../pages/student/MyCourses'
import NewCourse from '../pages/instructor/NewCourse'
import EditCourse from '../pages/instructor/EditCourse'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminCourses from '../pages/admin/AdminCourses'
import DashboardPending from '../pages/DashboardPending'
const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard'))
const LessonViewer = lazy(() => import('../pages/student/LessonViewer'))
const InstructorDashboard = lazy(() => import('../pages/instructor/InstructorDashboard'))
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const Inbox = lazy(() => import('../pages/dashboard/Inbox'))
const Settings = lazy(() => import('../pages/dashboard/Settings'))
const Help = lazy(() => import('../pages/dashboard/Help'))
const Schedule = lazy(() => import('../pages/dashboard/Schedule'))
const LearningPaths = lazy(() => import('../pages/dashboard/LearningPaths'))
const InstructorCourses = lazy(() => import('../pages/instructor/InstructorCourses'))
const EvaluateStudents = lazy(() => import('../pages/instructor/EvaluateStudents'))
const Tracking = lazy(() => import('../pages/instructor/Tracking'))
const Groups = lazy(() => import('../pages/instructor/Groups'))

function InstructorFeature({ page, title }) {
  const { user } = useAuth()
  return user.role === 'instructor' ? page : <DashboardPending title={title} />
}

// A direct visit goes to the dashboard. Only resume destinations inside this website.
function GuestRoute() {
  const { user } = useAuth()
  const { pathname, state, search } = useLocation()
  if (!user) return <Outlet />
  const next = state?.from || new URLSearchParams(search).get('next')
  if (pathname === '/login' && typeof next === 'string' && /^\/(dashboard|learn|courses)([/?#]|$)/.test(next)) {
    return <Navigate to={next} replace />
  }
  return <Navigate to="/dashboard" replace />
}

function DashboardRedirect() {
  const { user } = useAuth()
  return <Navigate to={`/dashboard/${user.role}`} replace />
}

// Group routes by role so every page in a dashboard uses the same access rules.
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard/inbox" element={<InstructorFeature page={<Inbox />} title="Inbox" />} />
          <Route path="/dashboard/settings" element={<InstructorFeature page={<Settings />} title="Settings" />} />
          <Route path="/dashboard/help" element={<InstructorFeature page={<Help />} title="Help & Support" />} />
          <Route element={<ProtectedRoute allowedRoles={['instructor', 'student']} />}>
            <Route path="/dashboard/schedule" element={<InstructorFeature page={<Schedule />} title="Schedule" />} />
            <Route path="/dashboard/learning-paths" element={<InstructorFeature page={<LearningPaths />} title="Learning Path" />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/student/courses" element={<MyCourses />} />
            <Route path="/learn/:courseId" element={<LessonViewer />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['instructor', 'admin']} />}>
            <Route path="/dashboard/instructor" element={<InstructorDashboard />} />
            <Route path="/dashboard/instructor/courses" element={<InstructorCourses />} />
            <Route path="/dashboard/instructor/courses/new" element={<NewCourse />} />
            <Route path="/dashboard/instructor/courses/:id/edit" element={<EditCourse />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
            <Route path="/dashboard/instructor/evaluate" element={<EvaluateStudents />} />
            <Route path="/dashboard/instructor/tracking/:tab" element={<Tracking />} />
            <Route path="/dashboard/instructor/groups" element={<Groups />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/admin/users" element={<AdminUsers />} />
            <Route path="/dashboard/admin/courses" element={<AdminCourses />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
