import usePageTitle from '../../utils/usePageTitle'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CourseThumb from '../../components/common/CourseThumb'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import { getCourse } from '../../services/courseService'
import { getLessons } from '../../services/lessonService'
import CourseActions from './CourseActions'
import useHomeData from './useHomeData'
import '../../styles/courses.css'

const lessonTypes = { pdf: 'PDF', video: 'MP4', image: 'Image', link: 'Link' }

// Remount when the course changes so another course's content never flashes.
export default function CourseDetail() {
  usePageTitle('Course details')
  const { id } = useParams()
  return <CourseContent key={id} id={id} />
}

function CourseContent({ id }) {
  const [justEnrolled, setJustEnrolled] = useState(false)
  const navigate = useNavigate()
  const loadCourse = useCallback(() => getCourse(id), [id])
  const loadLessons = useCallback(() => getLessons(id), [id])
  const detail = useHomeData(loadCourse)
  const lessons = useHomeData(loadLessons)
  if (detail.loading) return <LoadingState variant="cards" count={1} />
  if (detail.status === 404) {
    return <EmptyState title="This course does not exist" message="Browse the catalogue to find another course."
      actionLabel="Browse courses" onAction={() => navigate('/courses')} />
  }
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.retry} />
  const { course } = detail.data

  return (
    <div className="row g-4 lh-course-detail">
      <div className="col-lg-8 lh-course-overview">
        <CourseThumb title={course.title} thumbnail={course.thumbnail} />
        <h1 className="page-title">{course.title}</h1>
        <p className="text-muted-lh">
          By {course.instructor?.name || 'Unknown instructor'} / {course.category} / {course.lessonCount} lessons / {course.enrolledCount + Number(justEnrolled)} students
        </p>
        <h2>About this course</h2>
        <p className="lh-course-description">{course.description}</p>
      </div>
      <aside className="col-lg-4 lh-course-actions">
        <CourseActions course={course} onEnrolled={() => setJustEnrolled(true)} />
      </aside>
      <section className="col-lg-8 lh-course-lessons">
        <h2>Lessons</h2>
        {lessons.loading && <LoadingState />}
        {lessons.error && <ErrorState message={lessons.error} onRetry={lessons.retry} />}
        {lessons.data?.length === 0 && <p>No lessons have been added yet. Check back for updates from the instructor.</p>}
        {lessons.data?.length > 0 && (
          <ol>
            {lessons.data.map(lesson => (
              <li key={lesson._id}>{lesson.title} <span className="text-muted-lh">· {lessonTypes[lesson.type] || lesson.type}</span></li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
