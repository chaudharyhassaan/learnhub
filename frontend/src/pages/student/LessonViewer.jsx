import usePageTitle from '../../utils/usePageTitle'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckLg } from 'react-bootstrap-icons'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import ProgressBar from '../../components/common/ProgressBar'
import { getMyCourse, updateLessonProgress } from '../../services/enrollmentService'
import { sendHeartbeat } from '../../services/dashboardService'
import getErrorMessage from '../../utils/getErrorMessage'
import useHomeData from '../public/useHomeData'
import LessonContent from './LessonContent'
import '../../styles/student.css'

const lessonTypes = { video: 'Video', pdf: 'PDF', image: 'Image', link: 'Link' }

// Key the viewer by course so pending updates cannot overwrite another course.
export default function LessonViewer() {
  usePageTitle('Lesson viewer')
  const { courseId } = useParams()
  return <EnrolledLessonViewer key={courseId} courseId={courseId} />
}

function EnrolledLessonViewer({ courseId }) {
  const navigate = useNavigate()
  const load = useCallback(() => getMyCourse(courseId), [courseId])
  const result = useHomeData(load)
  if (result.loading) return <LoadingState />
  if (result.status === 404) return (
    <EmptyState title="You are not enrolled in this course." message="Open the course page to enroll."
      actionLabel="View course" onAction={() => navigate(`/courses/${courseId}`)} />
  )
  if (result.error) return <ErrorState message={result.error} onRetry={result.retry} />
  return <CourseLessons courseId={courseId} initial={result.data} />
}

// Apply the server's progress and completion values together after a successful save.
function CourseLessons({ courseId, initial }) {
  const [courseData, setCourseData] = useState(initial)
  const [selected, setSelected] = useState(initial.lessons.find(lesson => !lesson.completed)?._id || initial.lessons[0]?._id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const lesson = courseData.lessons.find(item => item._id === selected)
  const viewingLesson = Boolean(lesson)

  // Restart the interval when hidden time interrupts a full 30 seconds of viewing.
  useEffect(() => {
    if (!viewingLesson) return
    let timer
    let pending = false
    function schedule() {
      clearInterval(timer)
      if (document.visibilityState !== 'visible') return
      timer = setInterval(async () => {
        if (pending || document.visibilityState !== 'visible') return
        pending = true
        try { await sendHeartbeat(courseId, 30) }
        catch { /* A transient tracking failure must not interrupt the lesson. */ }
        finally { pending = false }
      }, 30000)
    }
    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [courseId, viewingLesson])

  async function toggleCompletion() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const { progress, completed } = await updateLessonProgress(courseId, lesson._id, !lesson.completed)
      setCourseData(current => ({
        ...current,
        progress,
        lessons: current.lessons.map(item => item._id === lesson._id ? { ...item, completed } : item),
      }))
    } catch (failure) {
      setError(getErrorMessage(failure).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="lh-student-page">
      <header className="lh-student-page">
        <Link className="btn btn-text lh-back-courses" to="/dashboard/student/courses">Back to my courses</Link>
        <PageHeader title={courseData.course.title} />
        <ProgressBar value={courseData.progress} />
      </header>
      <div className="row g-4">
        <section className="col-lg-4">
          <h2>Lessons</h2>
          {courseData.lessons.length ? (
            <ol className="lh-lesson-list">
              {courseData.lessons.map((item, index) => (
                <li key={item._id}>
                  <button type="button" className="lh-lesson-select" disabled={saving} aria-current={item._id === selected ? 'true' : undefined}
                    onClick={() => { setError(''); setSelected(item._id) }}>
                    <span>{index + 1}. {item.title}<small>{lessonTypes[item.type] || item.type}</small></span>
                    {item.completed && <><CheckLg aria-hidden="true" /><span className="visually-hidden">Completed</span></>}
                  </button>
                </li>
              ))}
            </ol>
          ) : <p>No lessons have been added yet. Visit My courses to continue another course.</p>}
        </section>
        {lesson && <section className="col-lg-8 lh-lesson-viewer">
          <h2>{lesson.title}</h2>
          <LessonContent key={lesson._id} lesson={lesson} />
          {error && <p className="lh-error" role="alert">{error}</p>}
          <button type="button" className={`btn btn-${lesson.completed ? 'outline-primary' : 'primary'}`}
            disabled={saving} aria-busy={saving} onClick={toggleCompletion}>
            {saving ? 'Saving...' : lesson.completed ? 'Completed, undo' : 'Mark as complete'}
          </button>
        </section>}
      </div>
    </div>
  )
}
