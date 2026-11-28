import usePageTitle from '../../utils/usePageTitle'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import CourseThumb from '../../components/common/CourseThumb'
import CourseRating from '../../components/common/CourseRating'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import StatItem from '../../components/common/StatItem'
import StatRow from '../../components/common/StatRow'
import { useToast } from '../../context/ToastContext'
import { deleteCourse, getMyCourses } from '../../services/courseService'
import getErrorMessage from '../../utils/getErrorMessage'
import useHomeData from '../public/useHomeData'
import '../../styles/instructor.css'

const createPath = '/dashboard/instructor/courses/new'

// Remove a card only after the API confirms the cascade has completed.
export default function InstructorCourses() {
  usePageTitle('My Courses')
  const result = useHomeData(getMyCourses)
  const [removed, setRemoved] = useState([])
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const courses = result.data?.courses.filter(course => !removed.includes(course._id))

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteCourse(selected._id)
      setRemoved(current => [...current, selected._id])
      setSelected(null)
      toast.success('Course deleted.')
    } catch (error) {
      setSelected(null)
      toast.error(getErrorMessage(error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="lh-instructor-page">
      <PageHeader title="Your courses" action={courses?.length === 0 ? null :
        <Link className="btn btn-primary" to={createPath}>Create course</Link>} />
      {result.loading && <LoadingState variant="cards" />}
      {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
      {courses && <>
        <StatRow>
          <StatItem label="Courses" value={courses.length} />
          <StatItem label="Total students" value={courses.reduce((sum, course) => sum + course.enrolledCount, 0)} />
          <StatItem label="Lessons" value={courses.reduce((sum, course) => sum + course.lessonCount, 0)} />
        </StatRow>
        {courses.length ? (
          <div className="row g-3">
            {courses.map(course => (
              <div className="col-12 col-md-6 col-xl-4 d-flex flex-column" key={course._id}>
                <article className="card lh-instructor-course">
                  <CourseThumb title={course.title} thumbnail={course.thumbnail} />
                  <div className="card-body">
                    <h3>{course.title}</h3>
                    <p>{course.level} · {course.durationHours} hrs</p>
                    <CourseRating average={course.ratingAverage} count={course.ratingCount} />
                    <p>{course.lessonCount} lessons / {course.enrolledCount} students</p>
                    <div className="lh-instructor-actions">
                      <Link className="btn btn-primary" to={`/courses/${course._id}`}
                        aria-label={`View details for ${course.title}`}>View Details</Link>
                      <Link className="btn btn-outline-primary" to={`/dashboard/instructor/courses/${course._id}/edit`}
                        aria-label={`Edit ${course.title}`}>Edit</Link>
                      <button type="button" className="btn btn-text lh-delete-course" onClick={() => setSelected(course)}
                        aria-label={`Delete ${course.title}`}>Delete</button>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        ) : <EmptyState title="You have not created a course yet." message="Create a course to start adding lessons."
          actionLabel="Create your first course" onAction={() => navigate(createPath)} />}
      </>}
      <ConfirmModal show={Boolean(selected)} title={selected ? `Delete ${selected.title}?` : 'Delete course?'}
        message="Its lessons and enrollments will be removed. This cannot be undone."
        loading={deleting} onCancel={() => setSelected(null)} onConfirm={confirmDelete} />
    </div>
  )
}
