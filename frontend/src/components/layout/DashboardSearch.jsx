import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mic, StopFill } from 'react-bootstrap-icons'
import { searchDashboard } from '../../services/dashboardService'
import getErrorMessage from '../../utils/getErrorMessage'

const sections = [
  ['courses', 'Courses', item => '/courses/' + item._id],
  ['students', 'Students', (item, role) => (role === 'admin' ? '/dashboard/admin/users?search=' : '/dashboard/instructor/tracking/students?student=')
    + encodeURIComponent(role === 'admin' ? item.email : item._id)],
  ['groups', 'Groups', item => '/dashboard/instructor/groups?group=' + item._id],
]

// Cancel searches on query changes so old results cannot replace a newer query.
export default function DashboardSearch({ role }) {
  const location = useLocation()
  const [value, setValue] = useState('')
  const [openedAt, setOpenedAt] = useState('')
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const recognition = useRef(null)
  const input = useRef(null)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const query = value.trim()
  const open = query.length >= 2 && openedAt === location.key
  const current = result?.query === query && result.attempt === attempt ? result : null

  useEffect(() => {
    if (!open) return
    const request = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const data = await searchDashboard(query, request.signal)
        if (!request.signal.aborted) setResult({ query, attempt, data })
      } catch (error) {
        if (!request.signal.aborted) setResult({ query, attempt, error: getErrorMessage(error).message })
      }
    }, 300)
    return () => { clearTimeout(timer); request.abort() }
  }, [open, query, attempt])

  useEffect(() => () => recognition.current?.abort(), [])

  function voiceSearch() {
    if (recognition.current) {
      recognition.current.stop()
      return
    }
    const speech = new SpeechRecognition()
    speech.lang = document.documentElement.lang || 'en'
    speech.onresult = event => {
      setValue(event.results[0][0].transcript.trim().slice(0, 50))
      setOpenedAt(location.key)
      input.current?.focus()
    }
    speech.onerror = event => {
      if (event.error !== 'aborted') setVoiceError('Voice search is unavailable. Type your search instead.')
    }
    speech.onend = () => {
      recognition.current = null
      setListening(false)
    }
    try {
      speech.start()
      recognition.current = speech
      setListening(true)
      setVoiceError('')
    } catch {
      setVoiceError('Voice search could not start. Type your search instead.')
    }
  }

  return <div className="lh-portal-search" role="search" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpenedAt('')
  }} onKeyDown={event => {
    if (event.key === 'Escape') { input.current?.focus(); setOpenedAt('') }
  }}>
    <div className="lh-portal-search-field">
      <input ref={input} className="form-control" type="search" aria-label="Search courses or students"
        placeholder="Search courses or students" maxLength={50} value={value}
        onFocus={() => setOpenedAt(location.key)}
        onChange={event => { setValue(event.target.value); setOpenedAt(location.key) }} />
      {SpeechRecognition && <button type="button" className="btn btn-outline-primary" onClick={voiceSearch}
        aria-label={listening ? 'Stop voice search' : 'Start voice search'} aria-pressed={listening}>
        {listening ? <StopFill aria-hidden="true" /> : <Mic aria-hidden="true" />}
      </button>}
    </div>
    {voiceError && <p className="lh-error" role="status">{voiceError}</p>}
    {open && <div className="lh-portal-results" aria-label="Search results">
      {!current && <p role="status">Searching...</p>}
      {current?.error && <div><p role="alert">{current.error}</p>
        <button type="button" className="btn btn-text" onClick={() => setAttempt(n => n + 1)}>Try again</button></div>}
      {current?.data && sections.map(([key, label, link]) => current.data[key]?.length > 0 && (
        <div key={key}><strong>{label}</strong>
          {current.data[key].map(item => <Link key={item._id} to={link(item, role)} onClick={() => setOpenedAt('')}>
            {item.title || item.name}
          </Link>)}
        </div>
      ))}
      {current?.data && sections.every(([key]) => !current.data[key]?.length) && <p role="status">No matching results.</p>}
    </div>}
  </div>
}
