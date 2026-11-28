import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ConfirmModal from '../../components/common/ConfirmModal'
import ErrorState from '../../components/common/ErrorState'
import FormField from '../../components/common/FormField'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import ProgressBar from '../../components/common/ProgressBar'
import { getMyCourses } from '../../services/courseService'
import { createLearningPath, deleteLearningPath, getLearningPaths, updateLearningPath } from '../../services/dashboardService'
import usePageTitle from '../../utils/usePageTitle'
import useHomeData from '../public/useHomeData'
import useDashboardAction from './useDashboardAction'
import './tools.css'

// The sequence of course slots is the sequence stored by the API.
function PathEditor({ path, close, refresh }) {
  const courseList = useHomeData(getMyCourses)
  const [selected, setSelected] = useState(path?.courses.map(course => course._id) || ['', ''])
  const action = useDashboardAction()
  const unique = selected.every(Boolean) && new Set(selected).size === selected.length
  function move(index, target) {
    setSelected(current => {
      const next = [...current]
      const course = next[index]
      next[index] = next[target]
      next[target] = course
      return next
    })
  }
  if (courseList.loading) return <LoadingState />
  if (courseList.error) return <ErrorState message={courseList.error} onRetry={courseList.retry} />
  return <form className="lh-tool-form" onSubmit={event => {
    event.preventDefault()
    if (!unique) return
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    const data = { ...fields, courses: selected }
    action.run(() => path._id ? updateLearningPath(path._id, data) : createLearningPath(data), 'Learning path saved.', refresh)
  }}>
    <h2>{path._id ? 'Edit learning path' : 'New learning path'}</h2>
    <FormField label="Title" name="title" defaultValue={path.title} minLength={2} maxLength={120} required error={action.fields.title} />
    <FormField label="Description" name="description" defaultValue={path.description} as="textarea" maxLength={500} error={action.fields.description} />
    {selected.map((value, index) => <div className="lh-path-slot" key={index}>
      <FormField label={'Course ' + (index + 1)} as="select" value={value} required
        onChange={event => {
          const courseId = event.target.value
          setSelected(current => current.map((item, slot) => slot === index ? courseId : item))
        }}>
        <option value="">Choose a course</option>
        {courseList.data.courses.map(course => (
          <option key={course._id} value={course._id} disabled={course._id !== value && selected.includes(course._id)}>{course.title}</option>
        ))}
      </FormField>
      <button type="button" className="btn btn-text" disabled={index === 0} onClick={() => move(index, index - 1)}
        aria-label={'Move course ' + (index + 1) + ' up'}>Move up</button>
      {selected.length > 2 && <button type="button" className="btn btn-text"
        onClick={() => setSelected(current => current.filter((_, slot) => slot !== index))}>Remove</button>}
    </div>)}
    {action.fields.courses && <p className="lh-error" role="alert">{action.fields.courses}</p>}
    {courseList.data.courses.length < 2 && <p>Create at least two courses before saving a path.</p>}
    <div className="lh-tool-actions">
      <button type="button" className="btn btn-outline-primary" disabled={selected.length >= 8 || selected.length >= courseList.data.courses.length}
        onClick={() => setSelected(current => [...current, ''])}>Add course</button>
      <button type="button" className="btn btn-outline-primary" onClick={close}>Cancel</button>
      <button type="submit" className="btn btn-primary" disabled={!unique || action.busy}>Save path</button>
    </div>
  </form>
}

export default function LearningPaths() {
  usePageTitle('Learning Path')
  const { user } = useAuth()
  const result = useHomeData(getLearningPaths)
  const action = useDashboardAction()
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const manager = user.role !== 'student'
  function refresh() {
    setEditing(null)
    setSelected(null)
    result.retry()
  }
  return <div className="lh-tool-page">
    <PageHeader title="Learning Path" action={manager && <button className="btn btn-outline-primary" type="button"
      onClick={() => setEditing({})}>Create path</button>} />
    {result.loading && <LoadingState />}
    {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
    {result.data?.paths.length === 0 && <p>No learning paths yet.</p>}
    {result.data?.paths.map(path => <article className="card lh-path-card" key={path._id}>
      <h2>{path.title}</h2><p>{path.description}</p>
      <ol>{path.courses.map(course => <li key={course._id}>
        <Link className="btn btn-text" to={'/courses/' + course._id}>{course.title}</Link>
        {user.role === 'student' && <><span>{course.status}</span>
          {course.status !== 'not enrolled' && <ProgressBar value={course.progress} />}</>}
      </li>)}</ol>
      {(user.role === 'admin' || path.instructor === user.id) && <div className="lh-tool-actions">
        <button type="button" className="btn btn-outline-primary" onClick={() => setEditing(path)}>Edit path</button>
        <button type="button" className="btn btn-text" onClick={() => setSelected(path)}>Delete path</button>
      </div>}
    </article>)}
    {editing && <PathEditor key={editing._id || 'new'} path={editing} close={() => setEditing(null)} refresh={refresh} />}
    <ConfirmModal show={Boolean(selected)} title="Delete learning path?" message="Courses remain available in the catalogue."
      loading={action.busy} onCancel={() => setSelected(null)}
      onConfirm={() => action.run(() => deleteLearningPath(selected._id), 'Learning path deleted.', refresh)} />
  </div>
}
