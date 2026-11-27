import usePageTitle from '../../utils/usePageTitle'
import { Link, useNavigate } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import StatItem from '../../components/common/StatItem'
import StatRow from '../../components/common/StatRow'
import { useAuth } from '../../context/AuthContext'
import { getMyCourses } from '../../services/enrollmentService'
import useHomeData from '../public/useHomeData'
import EnrolledCourses from './EnrolledCourses'
import { completed, inProgress } from './progressFilters'
import '../../styles/student.css'

// Refetch enrollments on entry so the dashboard reflects changes from the viewer.
export default function StudentDashboard() {
  usePageTitle('Student dashboard')
  const { user } = useAuth()
  const navigate = useNavigate()
  const result = useHomeData(getMyCourses)
  const courses = result.data?.courses
  const continuing = courses?.filter(course => !completed(course)) || []
  const finished = courses?.filter(completed) || []
  return (
    <div className="lh-student-page">
      <PageHeader title={`Welcome back, ${user.name.trim().split(/\s+/)[0]}`} description="Pick up where you left off." />
      {result.loading && <LoadingState variant="cards" />}
      {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
      {courses && <>
        <StatRow>
          <StatItem label="Enrolled" value={courses.length} />
          <StatItem label="In progress" value={courses.filter(inProgress).length} />
          <StatItem label="Completed" value={finished.length} />
        </StatRow>
        <section>
          <div className="lh-student-heading">
            <h2>Continue learning</h2>
            {courses.length > 0 && <Link className="btn btn-text" to="/dashboard/student/courses">View all</Link>}
          </div>
          {courses.length ? <EnrolledCourses courses={[...continuing, ...finished].slice(0, 3)} /> : (
            <EmptyState title="You have not enrolled in any course yet." message="Browse the catalogue to find a course."
              actionLabel="Browse courses" onAction={() => navigate('/courses')} />
          )}
        </section>
      </>}
    </div>
  )
}
