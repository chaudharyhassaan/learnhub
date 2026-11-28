import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import { getEvents } from '../../services/dashboardService'
import useHomeData from '../public/useHomeData'
import './calendar.css'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
const dayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const timeLabel = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit' })
const hours = Array.from({ length: 11 }, (_, index) => index + 8)

function dateAt(day, hour = 0) {
  const date = new Date(day)
  date.setHours(hour, 0, 0, 0)
  return date
}

function overlaps(event, day) {
  return new Date(event.startsAt) < new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1) &&
    new Date(event.endsAt) > dateAt(day)
}

function eventTime(event) {
  return timeLabel.format(new Date(event.startsAt)) + ' to ' + timeLabel.format(new Date(event.endsAt))
}

// Position events within the visible hours and keep simultaneous events in separate lanes.
function Timeline({ events, day, now }) {
  const start = dateAt(day, 8).getTime()
  const end = dateAt(day, 18).getTime()
  const lanes = []
  const blocks = events.filter(event => new Date(event.startsAt) < end && new Date(event.endsAt) > start).map(event => {
    const begins = Math.max(start, new Date(event.startsAt).getTime())
    const finishes = Math.min(end, new Date(event.endsAt).getTime())
    let lane = lanes.findIndex(until => until <= begins)
    if (lane < 0) lane = lanes.length
    lanes[lane] = finishes
    return { event, lane, begins, finishes }
  })
  const percent = time => 100 * (time - start) / (end - start)
  return <>
    <div className="lh-timeline" aria-label="Schedule from 8 am to 6 pm">
      {hours.map((hour, index) => <div className="lh-hour" key={hour} style={{ top: index * 10 + '%' }}>
        <span>{hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}</span>
      </div>)}
      <div className="lh-timeline-events">
        {blocks.map(({ event, lane, begins, finishes }) => <div className="lh-timeline-event" key={event._id}
          style={{ top: percent(begins) + '%', height: (percent(finishes) - percent(begins)) + '%',
            left: 100 * lane / lanes.length + '%', width: 100 / lanes.length + '%' }}
          title={event.title + ', ' + eventTime(event)}>
          <strong>{event.title}</strong><small>{eventTime(event)}</small>
        </div>)}
        {now >= start && now <= end && <div className="lh-time-marker" style={{ top: percent(now) + '%' }} aria-label="Current time" />}
      </div>
    </div>
    {events.length > blocks.length && <p>More events are listed on the Schedule page.</p>}
  </>
}

// Fetch the month once. Date selection uses that result for the timeline or editable list.
export default function Calendar({ compact = false, onEdit, onAdd, calendarVersion }) {
  const [selected, setSelected] = useState(() => new Date())
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  const year = selected.getFullYear()
  const month = selected.getMonth()
  const first = new Date(year, month, 1)
  const total = new Date(year, month + 1, 0).getDate()
  const load = useCallback(() => getEvents(new Date(year, month, 1).toISOString(),
    new Date(year, month + 1, 1).toISOString()), [year, month])
  const result = useHomeData(load, calendarVersion)
  const all = result.data?.events || []
  const events = all.filter(event => overlaps(event, selected))

  return <section className={compact ? 'card lh-events-panel' : 'lh-events-panel'}>
    {compact && <div className="lh-section-heading"><h2>Events</h2><Link className="btn btn-text" to="/dashboard/schedule">View All</Link></div>}
    <div className="lh-month-heading">
      <button type="button" className="btn btn-text" aria-label="Previous month" onClick={() => setSelected(new Date(year, month - 1, 1))}><ChevronLeft aria-hidden="true" /></button>
      <strong aria-live="polite">{monthLabel.format(first)}</strong>
      <button type="button" className="btn btn-text" aria-label="Next month" onClick={() => setSelected(new Date(year, month + 1, 1))}><ChevronRight aria-hidden="true" /></button>
    </div>
    <div className="lh-calendar-grid">
      {weekdays.map(day => <span key={day}>{day}</span>)}
      {Array.from({ length: first.getDay() }, (_, index) => <span key={'pad-' + index} />)}
      {Array.from({ length: total }, (_, index) => {
        const day = new Date(year, month, index + 1)
        const hasEvent = all.some(event => overlaps(event, day))
        return <button type="button" key={index} aria-pressed={selected.getDate() === index + 1}
          aria-current={day.toDateString() === today.toDateString() ? 'date' : undefined}
          className={hasEvent ? 'lh-calendar-event' : undefined}
          aria-label={dayLabel.format(day) + (hasEvent ? ', has events' : '')} onClick={() => setSelected(day)}>{index + 1}</button>
      })}
    </div>
    <div className="lh-section-heading"><h3>{dayLabel.format(selected)}</h3>
      {onAdd && <button type="button" className="btn btn-primary" onClick={() => onAdd(selected)}>Add event</button>}
    </div>
    {result.loading && <LoadingState count={2} />}
    {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
    {result.data && events.length === 0 && <p>No events on this date.</p>}
    {compact && result.data && <Timeline events={events} day={selected} now={today} />}
    {!compact && <ul className="lh-dashboard-list">{events.map(event => <li key={event._id}>
      <div><strong>{event.title}</strong><p>{eventTime(event)} · {event.type}</p>{event.description && <p>{event.description}</p>}</div>
      {onEdit && <button type="button" className="btn btn-outline-primary" onClick={() => onEdit(event)}>Edit</button>}
    </li>)}</ul>}
  </section>
}
