import { useCallback, useState } from 'react'
import LoadingState from '../../components/common/LoadingState'
import { getFileUrl, getLessonAccess } from '../../services/lessonService'
import useHomeData from '../public/useHomeData'

// Check the PDF response before embedding because iframe HTTP errors may still fire load.
export default function LessonContent({ lesson }) {
  const load = useCallback(async () => {
    const access = await getLessonAccess(lesson._id)
    if (!access.fileUrl) return access
    const url = getFileUrl(access.fileUrl)
    if (lesson.type === 'pdf') {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
      if (!response.ok) throw new Error('PDF unavailable')
    }
    return { ...access, url }
  }, [lesson._id, lesson.type])
  const result = useHomeData(load)
  const [failed, setFailed] = useState(false)

  function reload() {
    setFailed(false)
    result.retry()
  }

  if (result.loading) return <LoadingState />
  if (result.error || failed) return (
    <div>
      <p role="alert">{result.error || 'The lesson could not be opened. Reload the lesson to try again.'}</p>
      <button type="button" className="btn btn-outline-primary" onClick={reload}>Reload lesson</button>
    </div>
  )

  const { url, lesson: content } = result.data
  const onError = () => setFailed(true)
  if (content.type === 'link') return (
    <div>
      <p>This lesson opens in a new tab.</p>
      <a className="btn btn-outline-primary" href={content.contentUrl} target="_blank" rel="noopener noreferrer">Open link</a>
    </div>
  )
  return (
    <div className="lh-lesson-media">
      {content.type === 'video' && <video controls src={url} onError={onError} />}
      {content.type === 'pdf' && <iframe title={lesson.title} src={url} onError={onError} />}
      {content.type === 'image' && <img alt={lesson.title} src={url} onError={onError} />}
      <button type="button" className="btn btn-text" onClick={reload}>Reload lesson</button>
    </div>
  )
}
