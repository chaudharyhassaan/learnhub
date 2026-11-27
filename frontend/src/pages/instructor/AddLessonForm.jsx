import { useState } from 'react'
import FormField from '../../components/common/FormField'
import ProgressBar from '../../components/common/ProgressBar'
import { useToast } from '../../context/ToastContext'
import { createLesson } from '../../services/lessonService'
import getErrorMessage from '../../utils/getErrorMessage'

const fileTypes = { pdf: 'application/pdf', mp4: 'video/mp4', png: 'image/png', jpg: 'image/jpeg' }
const maxFileSize = 50 * 1024 * 1024

function fileError(file) {
  if (!file?.name) return 'Choose a lesson file.'
  const extension = /\.([^.]+)$/.exec(file.name.toLowerCase())?.[1]
  if (!Object.hasOwn(fileTypes, extension) || fileTypes[extension] !== file.type) return 'Choose a PDF, MP4, PNG or JPG file.'
  if (file.size > maxFileSize) return 'Choose a file no larger than 50 MB.'
  return ''
}

// Send only the chosen source and report bytes uploaded separately from server processing.
export default function AddLessonForm({ courseId, onAdded }) {
  const [source, setSource] = useState('file')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const title = fields.get('title').trim()
    const payload = new FormData()
    const nextErrors = {}
    if (title.length < 2 || title.length > 120) nextErrors.title = 'Use 2 to 120 characters.'
    payload.append('title', title)
    if (source === 'file') {
      const file = fields.get('file')
      const error = fileError(file)
      if (error) nextErrors.file = error
      else payload.append('file', file)
    } else {
      const link = fields.get('contentUrl').trim()
      if (!/^https?:\/\/[^\s]+$/i.test(link)) nextErrors.contentUrl = 'Enter a link starting with http:// or https://.'
      else payload.append('contentUrl', link)
    }
    setErrors(nextErrors)
    setMessage('')
    if (Object.keys(nextErrors).length) return

    setProgress(0)
    setSaving(true)
    try {
      await createLesson(courseId, payload, ({ loaded, total }) => {
        if (total) setProgress(100 * loaded / total)
      })
      form.reset()
      onAdded()
      toast.success('Lesson added.')
    } catch (error) {
      const failure = getErrorMessage(error)
      setErrors(failure.fieldErrors)
      if (!Object.keys(failure.fieldErrors).length) setMessage(failure.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="lh-instructor-form" onSubmit={submit} noValidate>
      <h3>Add a lesson</h3>
      <FormField name="title" label="Title" required maxLength={120} disabled={saving} error={errors.title} />
      <FormField label="Lesson source" as="select" value={source} disabled={saving}
        onChange={event => { setSource(event.target.value); setErrors({}); setMessage('') }}>
        <option value="file">Upload a file</option>
        <option value="link">Paste a link</option>
      </FormField>
      {source === 'file' ? (
        <FormField name="file" label="File" type="file" accept=".pdf,.mp4,.png,.jpg" required disabled={saving}
          hint="PDF, MP4, PNG or JPG, up to 50 MB" error={errors.file} />
      ) : (
        <FormField name="contentUrl" label="Link" type="url" required disabled={saving} error={errors.contentUrl} />
      )}
      {saving && source === 'file' && <ProgressBar label="Lesson upload progress" value={progress} />}
      {message && <p className="lh-error" role="alert">{message}</p>}
      <div className="lh-instructor-actions">
        <button type="submit" className="btn btn-primary" disabled={saving} aria-busy={saving}>
          {saving ? 'Adding lesson...' : 'Add lesson'}
        </button>
      </div>
    </form>
  )
}
