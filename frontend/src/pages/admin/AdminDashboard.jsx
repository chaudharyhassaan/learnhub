import PageHeader from '../../components/common/PageHeader'
import StatItem from '../../components/common/StatItem'
import StatRow from '../../components/common/StatRow'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import { getAnalytics, getAuditLogs } from '../../services/adminService'
import { formatDate } from '../../utils/format'
import useHomeData from '../public/useHomeData'
import AdminTable from './AdminTable'
import './admin.css'

const roles = ['admin', 'instructor', 'student']
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })

// Keep counts in plain text and hide the decorative bar from assistive technology.
function HorizontalBars({ rows }) {
  const max = Math.max(1, ...rows.map(row => row.count))
  return <ul className="lh-admin-bars">{rows.map(({ label, count }, index) => (
    <li key={index}><span>{label}</span>
      <div className="lh-admin-track" aria-hidden="true"><div style={{ width: (count / max * 100) + '%' }} /></div>
      <span>{count}</span>
    </li>
  ))}</ul>
}

// The hidden table exposes the same dates and counts as the chart.
function DailyEnrollments({ days }) {
  const max = Math.max(1, ...days.map(day => day.count))
  return <>
    <div className="lh-admin-days" aria-hidden="true">{days.map(({ date, count }) => (
      <div className="lh-admin-day" key={date}>
        <div className="lh-admin-column">
          <div className="lh-admin-column-fill" style={{ height: (count / max * 100) + '%' }}><span>{count}</span></div>
        </div>
        <span>{weekday.format(new Date(date))}</span>
      </div>
    ))}</div>
    <table className="visually-hidden">
      <caption>Enrollments in the last 7 days</caption>
      <thead><tr><th scope="col">Date (UTC)</th><th scope="col">Enrollments</th></tr></thead>
      <tbody>{days.map(({ date, count }) => <tr key={date}><td>{date}</td><td>{count}</td></tr>)}</tbody>
    </table>
  </>
}

// Audit activity can load and retry independently of the enrollment charts.
export default function AdminDashboard() {
  const analytics = useHomeData(getAnalytics)
  const activity = useHomeData(getAuditLogs)
  const data = analytics.data
  const logs = activity.data?.logs.slice(0, 10)
  return <div className="lh-admin-page">
    <PageHeader title="Overview" />
    {analytics.loading && <LoadingState />}
    {analytics.error && <ErrorState message={analytics.error} onRetry={analytics.retry} />}
    {data && <>
      <div>
        <StatRow>
          <StatItem label="Users" value={data.totals.users} />
          <StatItem label="Courses" value={data.totals.courses} />
          <StatItem label="Enrollments" value={data.totals.enrollments} />
        </StatRow>
        <p className="lh-admin-summary">Lessons: {data.totals.lessons} / Average progress: {data.averageProgress}%</p>
      </div>
      <section><h2>Users by role</h2>
        <HorizontalBars rows={roles.map(label => ({ label, count: data.usersByRole[label] }))} />
      </section>
      <section><h2>Top courses</h2>
        {data.topCourses.length ? <HorizontalBars rows={data.topCourses.slice(0, 5).map(course => ({
          label: course.title, count: course.enrollments,
        }))} /> : <p>No course enrollments yet.</p>}
      </section>
      <section><h2>Enrollments in the last 7 days</h2>
        <DailyEnrollments days={data.enrollmentsLast7Days} />
      </section>
    </>}
    <section><h2>Recent admin activity</h2>
      {activity.loading && <LoadingState variant="table" />}
      {activity.error && <ErrorState message={activity.error} onRetry={activity.retry} />}
      {logs?.length === 0 && <p>No admin activity yet.</p>}
      {logs?.length > 0 && <AdminTable label="Recent admin activity" columns={['Who', 'What', 'When']}>
        {logs.map(log => <tr key={log._id}>
          <td>{log.actor.name}</td><td>{log.details || log.action.replaceAll('_', ' ')}</td>
          <td><time dateTime={log.createdAt}>{formatDate(log.createdAt)}</time></td>
        </tr>)}
      </AdminTable>}
    </section>
  </div>
}
