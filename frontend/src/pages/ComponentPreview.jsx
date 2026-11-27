import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../components/common/FormField'
import PasswordField from '../components/common/PasswordField'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import ConfirmModal from '../components/common/ConfirmModal'
import StatRow from '../components/common/StatRow'
import StatItem from '../components/common/StatItem'
import ProgressBar from '../components/common/ProgressBar'
import CourseCard from '../components/common/CourseCard'
import PageHeader from '../components/common/PageHeader'
import { useToast } from '../context/ToastContext'

const course = { _id: 'preview', title: 'Web development', instructor: { name: 'Amina' }, category: 'Programming', price: 25 }

// A development-only route exercises the components before the real page forms exist.
export default function ComponentPreview() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const toast = useToast()
  const navigate = useNavigate()
  async function confirm() {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 700))
    setLoading(false)
    setShow(false)
    toast.success('Preview change saved.')
  }
  return <div className="lh-preview">
    <PageHeader title="Shared components" description="Preview the controls used across LearnHub."
      action={<button className="btn btn-outline-primary" onClick={() => setShow(true)}>Open confirmation</button>} />
    <section><h2>Dashboard layouts</h2><nav className="lh-preview-links" aria-label="Preview dashboard layouts">
      {['student', 'instructor', 'admin'].map(role => <Link key={role} to={`/components/dashboard/${role}`}>{role}</Link>)}
    </nav></section>
    <section><h2>Form fields</h2>
      <FormField label="Name" value={name} onChange={event => setName(event.target.value)}
        hint="Use your course profile name." error={name.trim() ? '' : 'Enter your name.'} />
      <PasswordField autoComplete="off" />
    </section>
    <section><h2>Course statistics</h2><StatRow>
      <StatItem value={12} label="Courses" /><StatItem value={84} label="Learners" /><StatItem value={4} label="Instructors" />
    </StatRow></section>
    <section><h2>Course card</h2><CourseCard course={course} /></section>
    <section><h2>Lesson progress</h2><ProgressBar value={62} /></section>
    <EmptyState title="No courses yet" message="Browse the catalogue to find your first course."
      actionLabel="Browse courses" onAction={() => navigate('/courses')} />
    <section><h2>Error message</h2><ErrorState message="The preview course could not be loaded."
      onRetry={() => toast.error('The preview course is still unavailable.')} /></section>
    <section><h2>Loading cards</h2><LoadingState variant="cards" /></section>
    <section><h2>Loading table</h2><LoadingState variant="table" /></section>
    <section><h2>Loading text</h2><LoadingState /></section>
    <ConfirmModal show={show} title="Save preview change?" message="This will display a success message."
      onCancel={() => setShow(false)} loading={loading} onConfirm={confirm} />
  </div>
}
