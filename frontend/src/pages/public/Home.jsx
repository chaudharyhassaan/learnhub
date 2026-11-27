import usePageTitle from '../../utils/usePageTitle'
import { Link, useNavigate } from 'react-router-dom'
import Accordion from 'react-bootstrap/Accordion'
import CourseCard from '../../components/common/CourseCard'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import StatRow from '../../components/common/StatRow'
import StatItem from '../../components/common/StatItem'
import { useAuth } from '../../context/AuthContext'
import { getCourses, getStats } from '../../services/courseService'
import HeroImage from './HeroImage'
import useHomeData from './useHomeData'
import '../../styles/home.css'

const loadFeatured = () => getCourses({ limit: 4, sort: 'newest' })

const steps = [
  ['Browse', 'Search by topic or filter by category.'],
  ['Enroll', 'Create a free account and enroll in one click.'],
  ['Learn', 'Open lessons, mark them done and watch your progress grow.'],
]

const questions = [
  ['Is LearnHub free?', 'Enrolling is free in this version. Prices are shown for reference.'],
  ['Can I teach on LearnHub?', 'Yes. Register as an instructor to create courses and upload lessons.'],
  ['What can I upload as a lesson?', 'PDF, MP4, PNG and JPG files up to 50 MB, or a link.'],
  ['How is my progress saved?', 'Each time you mark a lesson complete we save it to your account.'],
  ['Who can see my files?', 'Only enrolled students, the course instructor and admins.'],
]

// Load stats and featured courses independently so either section can be retried.
export default function Home() {
  usePageTitle('Home')
  const stats = useHomeData(getStats)
  const featured = useHomeData(loadFeatured)
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="lh-home">
      <section className="section container-narrow">
        <div className="row g-4 align-items-center">
          <div className="col-lg-6">
            <h1 className="page-title">Courses taught by people who do the work.</h1>
            <p className="lh-hero-copy">Browse practical courses, enroll in one click and pick up where you left off.</p>
            <div className="lh-hero-actions">
              <Link className="btn btn-primary" to="/courses">Browse courses</Link>
              <Link className="btn btn-text" to="/login">Log in</Link>
            </div>
          </div>
          <div className="col-lg-6"><HeroImage /></div>
        </div>
      </section>

      <section className="section container-narrow">
        <h2 className="lh-stats-caption">LearnHub right now</h2>
        {stats.loading && <LoadingState variant="table" count={1} />}
        {stats.error && <ErrorState message={stats.error} onRetry={stats.retry} />}
        {stats.data && (
          <StatRow>
            <StatItem label="Courses" value={stats.data.courses.toLocaleString()} />
            <StatItem label="Learners" value={stats.data.learners.toLocaleString()} />
            <StatItem label="Instructors" value={stats.data.instructors.toLocaleString()} />
          </StatRow>
        )}
      </section>

      <section className="section container-narrow">
        <h2>Learning online gets scattered.</h2>
        <p>Videos live in one tab, notes in another, and nothing tells you how far you have come.</p>
      </section>

      <section className="section container-narrow">
        <h2>One place for every course.</h2>
        <p>LearnHub keeps your courses, lessons and progress together.</p>
        {featured.loading && <LoadingState variant="cards" count={4} />}
        {featured.error && <ErrorState message={featured.error} onRetry={featured.retry} />}
        {featured.data?.courses.length === 0 && (
          <EmptyState title="No courses yet" message="Check the catalogue for new courses."
            actionLabel="See all courses" onAction={() => navigate('/courses')} />
        )}
        {featured.data?.courses.length > 0 && (
          <>
            <div className="row g-3">
              {featured.data.courses.slice(0, 4).map(course => (
                <div key={course._id} className="col-12 col-md-6 col-lg-3 d-flex">
                  <div className="w-100 d-flex flex-column"><CourseCard course={course} /></div>
                </div>
              ))}
            </div>
            <Link className="btn btn-outline-primary lh-see-courses" to="/courses">See all courses</Link>
          </>
        )}
      </section>

      <section className="section container-narrow">
        <h2 className="lh-steps-title">How it works</h2>
        <ol className="row g-4 lh-home-steps" role="list">
          {steps.map(([title, description], index) => (
            <li key={title} className="col-md-4">
              <span aria-hidden="true">{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section container-narrow">
        <h2>Questions</h2>
        <Accordion flush className="lh-home-faq">
          {questions.map(([question, answer]) => (
            <Accordion.Item key={question} eventKey={question}>
              <Accordion.Header>{question}</Accordion.Header>
              <Accordion.Body>{answer}</Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </section>

      <section className="section lh-home-cta">
        <div className="container-narrow">
          <h2>Ready to start learning?</h2>
          <Link className="btn btn-primary" to={user ? '/dashboard' : '/register'}>
            {user ? 'Dashboard' : 'Create your account'}
          </Link>
        </div>
      </section>
    </div>
  )
}
