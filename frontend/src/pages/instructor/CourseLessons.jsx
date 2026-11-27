import { useCallback, useState } from 'react'
import ConfirmModal from '../../components/common/ConfirmModal'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import { useToast } from '../../context/ToastContext'
import { deleteLesson, getLessons } from '../../services/lessonService'
import getErrorMessage from '../../utils/getErrorMessage'
import useHomeData from '../public/useHomeData'
import AddLessonForm from './AddLessonForm'

const types = { pdf: 'PDF', video: 'MP4', image: 'Image', link: 'Link' }

// Refresh the ordered list after changes so the numbers match the API.
export default function CourseLessons({ courseId }) {
  const load = useCallback(() => getLessons(courseId), [courseId])
  const result = useHomeData(load)
  const [selected, setSelected] = useState(null)
  const [removing, setRemoving] = useState(false)
  const toast = useToast()

  async function remove() {
    setRemoving(true)
    try {
      await deleteLesson(selected._id)
      setSelected(null)
      result.retry()
      toast.success('Lesson removed.')
    } catch (error) {
      setSelected(null)
      toast.error(getErrorMessage(error).message)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section className="lh-instructor-lessons" aria-labelledby="instructor-lessons-title">
      <h2 id="instructor-lessons-title">Lessons</h2>
      {result.loading && <LoadingState variant="table" />}
      {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
      {result.data?.length === 0 && <p>No lessons yet. Add your first lesson below.</p>}
      {result.data?.length > 0 && (
        <ol className="lh-instructor-lesson-list">
          {result.data.map((lesson, index) => (
            <li key={lesson._id}>
              <div><strong>{lesson.order ?? index + 1}. {lesson.title}</strong><br />
                <small>{types[lesson.type] || lesson.type}</small></div>
              <button type="button" className="btn btn-outline-primary" onClick={() => setSelected(lesson)}
                aria-label={`Remove ${lesson.title}`}>Remove</button>
            </li>
          ))}
        </ol>
      )}
      <AddLessonForm courseId={courseId} onAdded={result.retry} />
      <ConfirmModal show={Boolean(selected)} title={`Remove ${selected?.title}?`}
        message="Students will lose access to this lesson. This cannot be undone."
        loading={removing} onCancel={() => setSelected(null)} onConfirm={remove} />
    </section>
  )
}
