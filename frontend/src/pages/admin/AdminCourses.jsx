import usePageTitle from '../../utils/usePageTitle'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import PageHeader from '../../components/common/PageHeader'
import { deleteCourse, getCourses } from '../../services/courseService'
import { formatPrice } from '../../utils/format'
import useHomeData from '../public/useHomeData'
import AdminPagination from './AdminPagination'
import AdminTable from './AdminTable'
import useAdminDelete from './useAdminDelete'
import './admin.css'

// Reload the page after deletion and step back if its last course was removed.
export default function AdminCourses() {
  usePageTitle('Courses')
  const [page, setPage] = useState(1)
  const load = useCallback(() => getCourses({ page, limit: 50 }), [page])
  const result = useHomeData(load)
  const data = result.data
  const deletion = useAdminDelete(deleteCourse, 'Course deleted.', () => {
    if (data?.courses.length === 1 && page > 1) setPage(page - 1)
    result.retry()
  })

  return <div className="lh-admin-page">
    <PageHeader title="Courses" />
    {result.loading && <LoadingState variant="table" />}
    {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
    {data?.courses.length === 0 && <div><p>No courses yet. Create a course to add it to the catalogue.</p>
      <Link className="btn btn-outline-primary" to="/dashboard/instructor/courses/new">Create course</Link>
    </div>}
    {data?.courses.length > 0 && <AdminTable label="Courses"
      columns={['Title', 'Instructor', 'Category', 'Price', 'Students', 'Actions']}>
      {data.courses.map(course => <tr key={course._id}>
        <td>{course.title}</td><td>{course.instructor?.name || 'Unknown instructor'}</td>
        <td>{course.category}</td><td>{formatPrice(course.price)}</td><td>{course.enrolledCount}</td>
        <td><div className="lh-admin-actions">
          <Link className="btn btn-text" to={`/courses/${course._id}`} aria-label={`View ${course.title}`}>View</Link>
          <button type="button" className="btn btn-text lh-admin-delete"
            aria-label={`Delete ${course.title}`} onClick={() => deletion.setSelected(course)}>Delete</button>
        </div></td>
      </tr>)}
    </AdminTable>}
    {data && <AdminPagination page={page} pages={data.pages} onChange={setPage} />}
    <ConfirmModal show={Boolean(deletion.selected)} title={`Delete ${deletion.selected?.title}?`}
      message="Its lessons and enrollments will be removed. This cannot be undone."
      loading={deletion.deleting} onCancel={() => deletion.setSelected(null)} onConfirm={deletion.confirm} />
  </div>
}
