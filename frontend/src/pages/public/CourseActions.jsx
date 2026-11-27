import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { enroll, getMyCourses } from '../../services/enrollmentService'
import { formatPrice } from '../../utils/format'
import getErrorMessage from '../../utils/getErrorMessage'
import useHomeData from './useHomeData'

// Only students request enrollment data, and ownership controls the manage link.
export default function CourseActions({ course, onEnrolled }) {
  const { user } = useAuth()
  const { pathname, search, hash } = useLocation()
  let action
  if (!user) {
    action = <Link className="btn btn-primary" to="/login" state={{ from: pathname + search + hash }}>Log in to enroll</Link>
  } else if (user.role === 'student') {
    action = <StudentAction key={user.id || user._id} courseId={course._id} onEnrolled={onEnrolled} />
  } else if (user.role === 'admin' || (user.role === 'instructor' && course.instructor?._id === user.id)) {
    action = <Link className="btn btn-primary" to={`/dashboard/instructor/courses/${course._id}/edit`}>Manage course</Link>
  } else {
    action = <p className="mb-0">Instructor accounts cannot enroll.</p>
  }

  return <div className="card lh-price-card">
    <div className="card-body">
      <p className="lh-course-price">{formatPrice(course.price)}</p>
      {action}
    </div>
  </div>
}

// Wait for the account's courses before offering enrollment.
function StudentAction({ courseId, onEnrolled }) {
  const courses = useHomeData(getMyCourses)
  const toast = useToast()
  const [enrolled, setEnrolled] = useState(false)
  const [saving, setSaving] = useState(false)

  async function enrollNow() {
    setSaving(true)
    try {
      await enroll(courseId)
      setEnrolled(true)
      onEnrolled()
      toast.success('You are enrolled')
    } catch (error) {
      toast.error(getErrorMessage(error).message)
      if (error.response?.status === 409) courses.retry()
    } finally {
      setSaving(false)
    }
  }

  if (enrolled || courses.data?.courses.some(item => item.course?._id === courseId)) {
    return <Link className="btn btn-primary" to={`/learn/${courseId}`}>Continue learning</Link>
  }
  if (courses.loading) return <LoadingState count={1} />
  if (courses.error) return <ErrorState message={courses.error} onRetry={courses.retry} />
  return <button className="btn btn-primary" type="button" disabled={saving} aria-busy={saving} onClick={enrollNow}>
    {saving ? 'Enrolling…' : 'Enroll now'}
  </button>
}
