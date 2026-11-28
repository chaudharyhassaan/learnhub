import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import ErrorState from '../../components/common/ErrorState'
import FormField from '../../components/common/FormField'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import { getMyCourses } from '../../services/courseService'
import { addGroupMember, createGroup, deleteGroup, getGroups, getInstructorStudents, removeGroupMember, updateGroup } from '../../services/dashboardService'
import usePageTitle from '../../utils/usePageTitle'
import useHomeData from '../public/useHomeData'
import useDashboardAction from '../dashboard/useDashboardAction'
import '../dashboard/tools.css'

function GroupForm({ group, courses, saved }) {
  const action = useDashboardAction()
  const courseId = group?.course?._id
  return <form className="lh-tool-form" onSubmit={event => {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    action.run(() => group ? updateGroup(group._id, fields) : createGroup(fields), 'Group saved.', data => saved(data.group._id))
  }}>
    <h2>{group ? 'Edit group' : 'Create group'}</h2>
    <FormField label="Name" name="name" defaultValue={group?.name} required minLength={2} maxLength={60} error={action.fields.name} />
    {group ? <p>Course: {group.course?.title}</p> : <FormField label="Course" name="courseId" as="select" required error={action.fields.courseId}>
      <option value="">Choose a course</option>
      {courses.map(course => <option value={course._id} key={course._id}>{course.title}</option>)}
    </FormField>}
    <FormField label="Meeting label" name="meetingLabel" defaultValue={group?.meetingLabel} maxLength={40} error={action.fields.meetingLabel} />
    <button className="btn btn-primary" type="submit" disabled={action.busy || (!courseId && !courses.length)}>Save group</button>
  </form>
}

function Members({ group, refresh }) {
  const courseId = group.course?._id
  const load = useCallback(() => getInstructorStudents(courseId), [courseId])
  const students = useHomeData(load)
  const action = useDashboardAction()
  const [studentId, setStudentId] = useState('')
  const available = students.data?.students.filter(student => !group.members.some(member => member._id === student.studentId))
  return <section>
    <h2>Members</h2>
    {!group.members.length && <p>No members yet.</p>}
    <ul className="lh-dashboard-list">{group.members.map(member => <li key={member._id}>
      <strong>{member.name}</strong>
      <button className="btn btn-outline-primary" type="button" disabled={action.busy}
        onClick={() => action.run(() => removeGroupMember(group._id, member._id), 'Member removed.', refresh)}>Remove</button>
    </li>)}</ul>
    {students.loading && <LoadingState count={1} />}
    {students.error && <ErrorState message={students.error} onRetry={students.retry} />}
    {available?.length === 0 && <p>No other enrolled students are available.</p>}
    {available?.length > 0 && <form className="lh-tool-form" onSubmit={event => {
      event.preventDefault()
      if (studentId) action.run(() => addGroupMember(group._id, studentId), 'Member added.', refresh)
    }}>
      <FormField label="Enrolled student" as="select" required value={studentId}
        onChange={event => setStudentId(event.target.value)} error={action.fields.studentId}>
        <option value="">Choose a student</option>
        {available.map(student => <option value={student.studentId} key={student.studentId}>{student.name}</option>)}
      </FormField>
      <button className="btn btn-primary" type="submit" disabled={action.busy || !studentId}>Add member</button>
    </form>}
  </section>
}

// Group links can reopen a specific group from the dashboard or search results.
export default function Groups() {
  usePageTitle('Groups')
  const [query, setQuery] = useSearchParams()
  const groups = useHomeData(getGroups)
  const courses = useHomeData(getMyCourses)
  const action = useDashboardAction()
  const [confirm, setConfirm] = useState(false)
  const selected = query.get('group')
  const group = groups.data?.groups.find(item => item._id === selected)
  const editing = selected === 'new' || group
  function saved(id) {
    setQuery({ group: id }, { replace: true })
    groups.retry()
  }

  return <div className="lh-tool-page">
    <PageHeader title="My Groups" action={<button type="button" className="btn btn-outline-primary"
      onClick={() => setQuery({ group: 'new' })}>Create group</button>} />
    {(groups.loading || courses.loading) && <LoadingState />}
    {groups.error && <ErrorState message={groups.error} onRetry={groups.retry} />}
    {courses.error && <ErrorState message={courses.error} onRetry={courses.retry} />}
    {groups.data?.groups.length === 0 && <p>No groups yet. Create a group to get started.</p>}
    <ul className="lh-dashboard-list">{groups.data?.groups.map(item => <li key={item._id}>
      <div><strong>{item.name}</strong><p>{item.course?.title} · {item.members.length} members</p></div>
      <button className="btn btn-outline-primary" onClick={() => setQuery({ group: item._id })}
        aria-pressed={selected === item._id}>Manage group</button>
    </li>)}</ul>
    {selected && selected !== 'new' && groups.data && !group && <p>The selected group is unavailable.</p>}
    {editing && courses.data && <GroupForm key={selected} group={group || undefined} courses={courses.data.courses} saved={saved} />}
    {group?.course && <Members key={selected} group={group} refresh={groups.retry} />}
    {group && <button type="button" className="btn btn-outline-primary lh-fit-button"
      onClick={() => setConfirm(true)}>Delete group</button>}
    {group && <ConfirmModal show={confirm} title="Delete group?" message="This also removes events scheduled for this group."
      loading={action.busy} onCancel={() => setConfirm(false)}
      onConfirm={() => action.run(() => deleteGroup(group._id), 'Group deleted.', () => {
        setConfirm(false); setQuery({}); groups.retry()
      })} />}
  </div>
}
