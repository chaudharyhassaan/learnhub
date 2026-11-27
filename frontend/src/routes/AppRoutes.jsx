import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import PublicLayout from '../components/layout/PublicLayout'
import DashboardPreview from '../pages/DashboardPreview'
import ComponentPreview from '../pages/ComponentPreview'
import InstructorCourses from '../pages/instructor/InstructorCourses'
import Home from '../pages/public/Home'
import Courses from '../pages/public/Courses'
import CourseDetail from '../pages/public/CourseDetail'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import NotFound from '../pages/public/NotFound'
import StudentDashboard from '../pages/student/StudentDashboard'
import MyCourses from '../pages/student/MyCourses'
import LessonViewer from '../pages/student/LessonViewer'
import InstructorDashboard from '../pages/instructor/InstructorDashboard'
import NewCourse from '../pages/instructor/NewCourse'
import EditCourse from '../pages/instructor/EditCourse'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminCourses from '../pages/admin/AdminCourses'

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
        {import.meta.env.DEV && <Route path="/components" element={<ComponentPreview />} />}
        <Route path="*" element={<NotFound />} />
      </Route>
      {import.meta.env.DEV && <Route path="/components/dashboard/:role" element={<DashboardPreview />} />}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
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
