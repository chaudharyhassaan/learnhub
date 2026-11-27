import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorState from '../../components/common/ErrorState'
import FormField from '../../components/common/FormField'
import { useToast } from '../../context/ToastContext'
import { createCourse, getCategories, updateCourse } from '../../services/courseService'
import getErrorMessage from '../../utils/getErrorMessage'
import useHomeData from '../public/useHomeData'

// Use the same field names for both API payloads and inline server feedback.
export default function CourseForm({ course }) {
  const categories = useHomeData(getCategories)
  const navigate = useNavigate()
  const toast = useToast()
  const [description, setDescription] = useState(course?.description || '')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const fields = new FormData(event.currentTarget)
    const payload = {
      title: fields.get('title').trim(),
      category: fields.get('category'),
      price: Number(fields.get('price')),
      thumbnail: fields.get('thumbnail').trim(),
      description: description.trim(),
    }
    setErrors({})
    setMessage('')
    setSaving(true)
    try {
      if (course) {
        await updateCourse(course._id, payload)
        toast.success('Course updated.')
      } else {
        const result = await createCourse(payload)
        toast.success('Course created.')
        navigate(`/dashboard/instructor/courses/${result.course._id}/edit`, { replace: true })
      }
    } catch (error) {
      const failure = getErrorMessage(error)
      setErrors(failure.fieldErrors)
      if (!Object.keys(failure.fieldErrors).length) setMessage(failure.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="lh-instructor-form" onSubmit={submit}>
      <FormField name="title" label="Title" required minLength={3} maxLength={120}
        defaultValue={course?.title} error={errors.title} />
      <FormField name="category" label="Category" as="select" required defaultValue={course?.category || ''}
        disabled={categories.loading || Boolean(categories.error)} error={errors.category}>
        <option value="">{categories.loading ? 'Loading categories...' : 'Choose a category'}</option>
        {course?.category && !categories.data?.includes(course.category) && <option>{course.category}</option>}
        {categories.data?.map(category => <option key={category}>{category}</option>)}
      </FormField>
      {categories.error && <ErrorState message={categories.error} onRetry={categories.retry} />}
      <FormField name="price" label="Price" type="number" min="0" step="any" defaultValue={course?.price ?? 0}
        hint="Enter 0 for a free course" error={errors.price} />
      <FormField name="thumbnail" label="Thumbnail URL" type="url" defaultValue={course?.thumbnail}
        hint="Paste an image link or leave empty" error={errors.thumbnail} />
      <FormField name="description" label="Description" as="textarea" rows={6} required minLength={10} maxLength={2000}
        value={description} onChange={event => setDescription(event.target.value)}
        hint={`${description.length} / 2000 characters`} error={errors.description} />
      {message && <p className="lh-error" role="alert">{message}</p>}
      <div className="lh-instructor-actions">
        <button type="submit" className="btn btn-primary" disabled={saving || !categories.data} aria-busy={saving}>
          {saving ? 'Saving...' : course ? 'Save changes' : 'Create course'}
        </button>
        <Link className="btn btn-outline-primary" to="/dashboard/instructor">Cancel</Link>
      </div>
    </form>
  )
}
