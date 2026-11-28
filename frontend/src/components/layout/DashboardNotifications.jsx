import { useState } from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import { Bell } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom'
import { getNotifications, readAllNotifications, readNotification } from '../../services/dashboardService'
import getErrorMessage from '../../utils/getErrorMessage'
import useHomeData from '../../pages/public/useHomeData'

// Refresh when opened and update the read state after the server confirms it.
export default function DashboardNotifications() {
  const result = useHomeData(getNotifications)
  const [readIds, setReadIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const items = result.data?.notifications || []
  const unread = Math.max(0, (result.data?.unreadCount || 0) - readIds.length)

  async function mark(id) {
    setSaving(true)
    setError('')
    try {
      if (id) {
        await readNotification(id)
        setReadIds(ids => [...ids, id])
      } else {
        await readAllNotifications()
        setReadIds([])
        result.retry()
      }
    } catch (failure) {
      setError(getErrorMessage(failure).message)
    } finally {
      setSaving(false)
    }
  }

  function toggle(show) {
    if (show && !saving && !result.loading) {
      setReadIds([])
      result.retry()
    }
  }

  return <Dropdown align="end" onToggle={toggle}>
    <Dropdown.Toggle className="lh-portal-bell" variant="outline-primary" id="dashboard-notifications"
      aria-label={unread ? 'Notifications, ' + unread + ' unread' : 'Notifications'}>
      <Bell size={20} aria-hidden="true" />{unread > 0 && <span className="lh-unread-dot" aria-hidden="true" />}
    </Dropdown.Toggle>
    <Dropdown.Menu className="lh-portal-notifications">
      <div className="lh-notification-heading"><strong>Notifications</strong>
        <button type="button" className="btn btn-text" disabled={!unread || saving} onClick={() => mark()}>
          Mark all read
        </button></div>
      {result.loading && <p role="status">Loading notifications...</p>}
      {result.error && <div><p role="alert">{result.error}</p>
        <button type="button" className="btn btn-text" onClick={result.retry}>Try again</button></div>}
      {error && <p className="lh-error" role="alert">{error}</p>}
      {result.data && !items.length && <p>No notifications yet.</p>}
      {items.map(item => {
        const isUnread = !item.readAt && !readIds.includes(item._id)
        const internal = /^\/(?:dashboard|learn|courses)(?:\/|$)/.test(item.link) && !item.link.includes('\\')
        return <div className="lh-notification-item" key={item._id}>
          {internal ? <Dropdown.Item as={Link} to={item.link}
            onClick={() => { if (isUnread && !saving) mark(item._id) }}>{item.text}</Dropdown.Item> : <span>{item.text}</span>}
          {isUnread && <button type="button" className="btn btn-text" aria-label={'Mark as read: ' + item.text}
            onClick={() => mark(item._id)} disabled={saving}>Mark read</button>}
        </div>
      })}
    </Dropdown.Menu>
  </Dropdown>
}
