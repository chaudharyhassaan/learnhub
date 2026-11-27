import { useState } from 'react'

// A missing or unreachable thumbnail still identifies the course by its initials.
export default function CourseThumb({ title, thumbnail }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const initials = title.trim().split(/\s+/).slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase()
  if (thumbnail && thumbnail !== failedUrl) {
    return <img className="lh-thumb" src={thumbnail} alt="" onError={() => setFailedUrl(thumbnail)} />
  }
  return <div className="lh-thumb lh-initials" aria-hidden="true">{initials}</div>
}
