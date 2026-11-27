import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { getCourse } from '../../services/courseService'
import Forbidden from '../public/Forbidden'
import useHomeData from '../public/useHomeData'
import CourseForm from './CourseForm'
import CourseLessons from './CourseLessons'
import '../../styles/instructor.css'

// The public course fetch is readable by anyone, so check ownership before showing the editor.
export default function EditCourse() {
  const { id } = useParams()
  const { user } = useAuth()
  const load = useCallback(() => getCourse(id), [id])
  const result = useHomeData(load)
  if (result.loading) return <LoadingState />
  if (result.error) return <ErrorState message={result.error} onRetry={result.retry} />
  const { course } = result.data
  if (user.role !== 'admin' && course.instructor?._id !== user.id) return <Forbidden />

  return <div className="lh-instructor-page" key={id}>
    <PageHeader title="Edit course" />
    <CourseForm course={course} />
    <CourseLessons courseId={id} />
  </div>
}
