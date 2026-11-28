import { Link } from 'react-router-dom'
import { Award, Clock, HourglassSplit, People, Wallet2 } from 'react-bootstrap-icons'
import CourseCard from '../../components/common/CourseCard'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import { getInstructorOverview } from '../../services/dashboardService'
import usePageTitle from '../../utils/usePageTitle'
import Calendar from '../dashboard/Calendar'
import GroupCards from '../dashboard/GroupCards'
import useHomeData from '../public/useHomeData'
import '../dashboard/overview.css'

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function duration(seconds) {
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours ? hours + ' hr ' + minutes % 60 + ' mins' : minutes + ' mins'
}

function Metrics({ data }) {
  const metrics = [
    ['Total Users', data.learners.total + ' Learners', '+' + data.learners.newToday + ' Today', People],
    ['Total Earnings', '$ ' + money.format(data.earnings.total), '+$ ' + money.format(data.earnings.today) + ' Today', Wallet2],
    ['Avg. Learning Time', duration(data.avgLearningSeconds), null, HourglassSplit],
    ['Avg. Access Time', duration(data.avgAccessSeconds), null, Clock],
  ]
  return <div className="lh-metrics">
    <div className="lh-metric-grid">
      {metrics.map(([label, value, change, Icon]) => <article className="card lh-metric" key={label}>
        <div><h2>{label}</h2><strong>{value}</strong>{change && <small>{change}</small>}</div>
        <Icon size={32} aria-hidden="true" />
      </article>)}
    </div>
    <article className="card lh-completion-summary">
      <h2>Course Completion Rate</h2>
      <div className="lh-donut">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--lh-sand)" strokeWidth="12" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--lh-espresso)" strokeWidth="12"
            pathLength="100" strokeDasharray={data.completionRate + ' 100'} transform="rotate(-90 60 60)" />
        </svg>
        <div><Award size={24} aria-hidden="true" /><strong>{data.completionRate}%</strong></div>
      </div>
    </article>
  </div>
}

// Calendar data is independent so a metrics error does not hide the schedule.
export default function InstructorDashboard() {
  usePageTitle('Instructor Dashboard')
  const result = useHomeData(getInstructorOverview)
  const data = result.data
  return <div className="lh-overview-grid">
    <div className="lh-overview-main">
      <h1 className="visually-hidden">Instructor Dashboard</h1>
      {result.loading && <LoadingState variant="cards" />}
      {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
      {data && <>
        <Metrics data={data} />
        <section>
          <div className="lh-section-heading"><h2>My Courses</h2>
            <Link className="btn btn-text" to="/dashboard/instructor/courses">View All</Link></div>
          {data.courses.length ? <div className="lh-overview-courses">
            {data.courses.map(course => <CourseCard key={course._id} course={course} dashboard />)}
          </div> : <p>Create a course to see it here.</p>}
        </section>
        <section>
          <div className="lh-section-heading"><h2>My Groups</h2>
            <Link className="btn btn-text" to="/dashboard/instructor/groups">View All</Link></div>
          <GroupCards groups={data.groups} manage />
        </section>
      </>}
    </div>
    <div><Calendar compact /></div>
  </div>
}
