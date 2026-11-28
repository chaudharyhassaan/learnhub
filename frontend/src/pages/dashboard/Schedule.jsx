import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/common/PageHeader'
import FormField from '../../components/common/FormField'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import { getMyCourses } from '../../services/courseService'
import { createEvent, updateEvent, deleteEvent, getGroups } from '../../services/dashboardService'
import usePageTitle from '../../utils/usePageTitle'
import useHomeData from '../public/useHomeData'
import Calendar from './Calendar'
import useDashboardAction from './useDashboardAction'
import './tools.css'

function inputTime(value) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

// Convert the browser's local date and time to the API's ISO timestamps.
function EventEditor({ event, courses, groups, close, saved }) {
  const action = useDashboardAction()
  const [confirm, setConfirm] = useState(false)
  const [courseId, setCourseId] = useState(event.course?._id || '')
  const [groupId, setGroupId] = useState(event.group || '')
  const [dateError, setDateError] = useState('')
  function submit(form) {
    const data = Object.fromEntries(new FormData(form))
    const start = new Date(data.startsAt)
    const end = new Date(data.endsAt)
    if (end <= start) { setDateError('End time must be after start time.'); return }
    setDateError('')
    const payload = { ...data, groupId: groupId || null, startsAt: start.toISOString(), endsAt: end.toISOString() }
    const request = event._id ? () => updateEvent(event._id, payload) : () => createEvent(payload)
    action.run(request, 'Event saved.', saved)
  }
  return <Modal show onHide={action.busy ? undefined : close} centered aria-labelledby="event-editor-title">
    <Modal.Header closeButton={!action.busy}><Modal.Title id="event-editor-title">{event._id ? 'Edit event' : 'Add event'}</Modal.Title></Modal.Header>
    {confirm ? <>
      <Modal.Body>Delete this event from the schedule?</Modal.Body>
      <Modal.Footer><button className="btn btn-outline-primary" disabled={action.busy} onClick={() => setConfirm(false)}>Back</button>
        <button className="btn btn-danger" disabled={action.busy}
          onClick={() => action.run(() => deleteEvent(event._id), 'Event deleted.', saved)}>Confirm deletion</button></Modal.Footer>
    </> : <form onSubmit={e => { e.preventDefault(); submit(e.currentTarget) }}>
      <Modal.Body>
        <FormField label="Title" name="title" defaultValue={event.title} required minLength={2} maxLength={120} error={action.fields.title} />
        <FormField label="Type" name="type" as="select" defaultValue={event.type || 'lecture'}>
          <option value="lecture">Lecture</option><option value="assignment">Assignment</option><option value="exam">Exam</option>
        </FormField>
        <FormField label="Course" name="courseId" as="select" required value={courseId} error={action.fields.courseId}
          onChange={e => { setCourseId(e.target.value); setGroupId('') }}>
          <option value="">Choose a course</option>{courses.map(item => <option key={item._id} value={item._id}>{item.title}</option>)}
        </FormField>
        <FormField label="Group (optional)" as="select" value={groupId} onChange={e => setGroupId(e.target.value)} error={action.fields.groupId}>
          <option value="">All enrolled students</option>{groups.filter(item => item.course?._id === courseId).map(item => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
        </FormField>
        <FormField label="Starts" name="startsAt" type="datetime-local" required defaultValue={inputTime(event.startsAt)} error={action.fields.startsAt} />
        <FormField label="Ends" name="endsAt" type="datetime-local" required defaultValue={inputTime(event.endsAt)} error={dateError || action.fields.endsAt} />
        <FormField label="Description (optional)" name="description" as="textarea" defaultValue={event.description} maxLength={500} error={action.fields.description} />
      </Modal.Body>
      <Modal.Footer>
        {event._id && <button type="button" className="btn btn-text lh-delete-course" disabled={action.busy} onClick={() => setConfirm(true)}>Delete event</button>}
        <button type="button" className="btn btn-outline-primary" disabled={action.busy} onClick={close}>Cancel</button>
        <button className="btn btn-primary" disabled={action.busy} type="submit">Save event</button>
      </Modal.Footer>
    </form>}
  </Modal>
}

function EditableSchedule() {
  const courses = useHomeData(getMyCourses)
  const groups = useHomeData(getGroups)
  const [event, setEvent] = useState(null)
  const [version, setVersion] = useState(0)
  const dataReady = courses.data && groups.data
  function add(day) {
    const start = new Date(day)
    start.setHours(9, 0, 0, 0)
    setEvent({ startsAt: start, endsAt: new Date(start.getTime() + 3600000) })
  }
  return <>
    {(courses.loading || groups.loading) && <LoadingState count={1} />}
    {courses.error && <ErrorState message={courses.error} onRetry={courses.retry} />}
    {groups.error && <ErrorState message={groups.error} onRetry={groups.retry} />}
    {dataReady && !courses.data.courses.length && <p>Create a course before scheduling events.</p>}
    <Calendar calendarVersion={version} onEdit={dataReady ? setEvent : undefined}
      onAdd={dataReady && courses.data.courses.length ? add : undefined} />
    {event && <EventEditor event={event} courses={courses.data.courses} groups={groups.data.groups}
      close={() => setEvent(null)} saved={() => { setEvent(null); setVersion(n => n + 1) }} />}
  </>
}

export default function Schedule() {
  usePageTitle('Schedule')
  const { user } = useAuth()
  return <div className="lh-tool-page"><PageHeader title="Schedule" />
    {user.role === 'student' ? <Calendar /> : <EditableSchedule />}
  </div>
}
