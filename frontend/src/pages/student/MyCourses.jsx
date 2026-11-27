import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import { getMyCourses } from '../../services/enrollmentService'
import useHomeData from '../public/useHomeData'
import EnrolledCourses from './EnrolledCourses'
import { completed, inProgress } from './progressFilters'
import '../../styles/student.css'

const filters = [
  { label: 'All', matches: () => true, empty: 'You have not enrolled in any course yet.' },
  { label: 'In progress', matches: inProgress, empty: 'No courses in progress.' },
  { label: 'Completed', matches: completed, empty: 'No completed courses yet.' },
]

// The API returns all enrollments, so switching filters only changes the visible list.
export default function MyCourses() {
  const [selected, setSelected] = useState(filters[0])
  const navigate = useNavigate()
  const result = useHomeData(getMyCourses)
  const courses = result.data?.courses.filter(selected.matches)
  return (
    <div className="lh-student-page">
      <PageHeader title="My courses" />
      <div className="lh-student-filters" role="group" aria-label="Filter my courses">
        {filters.map(filter => (
          <button key={filter.label} type="button" className="btn btn-text"
            aria-pressed={selected === filter} onClick={() => setSelected(filter)}>{filter.label}</button>
        ))}
      </div>
      {result.loading && <LoadingState variant="cards" />}
      {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
      {courses && (courses.length ? <EnrolledCourses courses={courses} /> : (
        <EmptyState title={selected.empty}
          message={selected === filters[0] ? 'Find a course to get started.' : 'View all your enrollments.'}
          actionLabel={selected === filters[0] ? 'Browse courses' : 'View all'}
          onAction={selected === filters[0] ? () => navigate('/courses') : () => setSelected(filters[0])} />
      ))}
    </div>
  )
}
