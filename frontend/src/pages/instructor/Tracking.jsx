import { useCallback, useState } from 'react'
import { NavLink, useParams, useSearchParams } from 'react-router-dom'
import FormField from '../../components/common/FormField'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import { getMyCourses } from '../../services/courseService'
import { getTracking } from '../../services/dashboardService'
import { formatDate } from '../../utils/format'
import usePageTitle from '../../utils/usePageTitle'
import useHomeData from '../public/useHomeData'
import '../dashboard/tools.css'

const labels = ['0', '1-49', '50-99', '100']

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map(([, count]) => count))
  return <ul className="lh-tracking-bars">{rows.map(([label, count]) => <li key={label}>
    <span>{label}</span><span className="lh-tracking-track" aria-hidden="true">
      <span style={{ width: count / max * 100 + '%' }} /></span><strong>{count}</strong>
  </li>)}</ul>
}

function Students({ rows }) {
  if (!rows.length) return <p>No students match this view.</p>
  return <div className="lh-tool-table" role="region" tabIndex={0} aria-label="Student tracking">
    <table className="table">
      <thead><tr>{['Student', 'Course', 'Progress', 'Time spent', 'Last accessed'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.course._id + ':' + row.studentId}><th scope="row">{row.name}<br /><small>{row.email}</small></th>
        <td>{row.course.title}</td><td>{row.progress}%</td><td>{Math.round(row.totalSeconds / 60)} min</td>
        <td>{row.lastAccessedAt ? formatDate(row.lastAccessedAt) : 'Not yet'}</td></tr>)}</tbody>
    </table>
  </div>
}

export default function Tracking() {
  usePageTitle('Tracking')
  const { tab } = useParams()
  const [query, setQuery] = useSearchParams()
  const [courseId, setCourseId] = useState('')
  const courses = useHomeData(getMyCourses)
  const load = useCallback(() => getTracking(courseId || undefined), [courseId])
  const result = useHomeData(load)
  const student = query.get('student')
  return <div className="lh-tool-page">
    <PageHeader title="Tracking" />
    <nav className="lh-tool-tabs" aria-label="Tracking views">
      <NavLink className="btn btn-text" to="/dashboard/instructor/tracking/courses">Courses</NavLink>
      <NavLink className="btn btn-text" to="/dashboard/instructor/tracking/students">Students</NavLink>
    </nav>
    {courses.error && <ErrorState message={courses.error} onRetry={courses.retry} />}
    {courses.data && <FormField label="Course" as="select" value={courseId} onChange={event => setCourseId(event.target.value)}>
      <option value="">All courses</option>{courses.data.courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
    </FormField>}
    {result.loading && <LoadingState variant="table" />}
    {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
    {result.data && (tab === 'students' ? <>
      {student && <button className="btn btn-outline-primary lh-fit-button" onClick={() => setQuery({})}>Show all students</button>}
      <Students rows={student ? result.data.students.filter(row => row.studentId === student) : result.data.students} />
    </> : <>
      <section><h2>Enrollments in the last 30 days</h2>
        <Bars rows={result.data.enrollmentsByDay.map(({ date, count }) => [date, count])} /></section>
      <section><h2>Progress</h2><Bars rows={labels.map(label => [label + '%', result.data.progressBuckets[label]])} /></section>
    </>)}
  </div>
}
