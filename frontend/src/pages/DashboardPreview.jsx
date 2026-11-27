import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import DashboardFrame from '../components/layout/DashboardFrame'

// A sample identity previews the layout without creating a session or opening protected routes.
export default function DashboardPreview() {
  const { role } = useParams()
  const navigate = useNavigate()
  if (!['student', 'instructor', 'admin'].includes(role)) return <Navigate to="/components" replace />
  const title = role === 'admin' ? 'Overview' : 'Dashboard'
  return <DashboardFrame user={{ name: 'Preview user', role }} title={title} onLogout={() => navigate('/components')}>
    <h1 className="page-title">{title}</h1>
    <Link className="btn btn-outline-primary" to="/components">Back to components</Link>
  </DashboardFrame>
}
