import usePageTitle from '../../utils/usePageTitle'
import { Link } from 'react-router-dom'
export default function NotFound() {
  usePageTitle('Page not found')
  return <section><h1 className="page-title">Page not found</h1>
    <p>Browse the catalogue to find a course.</p>
    <Link className="btn btn-outline-primary" to="/courses">Browse courses</Link>
  </section>
}
