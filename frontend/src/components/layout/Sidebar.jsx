import { NavLink } from 'react-router-dom'
import { Book, Bookshelf, Compass, Grid, People, PlusSquare, BoxArrowRight } from 'react-bootstrap-icons'
import Wordmark from './Wordmark'

const links = {
  student: [
    ['Dashboard', '/dashboard/student', Grid],
    ['My courses', '/dashboard/student/courses', Book],
    ['Browse courses', '/courses', Compass],
  ],
  instructor: [
    ['Dashboard', '/dashboard/instructor', Grid],
    ['My courses', '/dashboard/instructor/courses', Bookshelf],
    ['Create course', '/dashboard/instructor/courses/new', PlusSquare],
  ],
  admin: [
    ['Overview', '/dashboard/admin', Grid],
    ['Users', '/dashboard/admin/users', People],
    ['Courses', '/dashboard/admin/courses', Bookshelf],
  ],
}

// Desktop and mobile use the same destinations and exact active-link matching.
export default function Sidebar({ role, onSelect, onLogout }) {
  return <div className="lh-sidebar-content">
    <Wordmark />
    <nav aria-label="Dashboard navigation">{links[role].map(([label, path, Icon]) =>
      <NavLink key={path} to={path} end onClick={onSelect}><Icon size={20} aria-hidden="true" />{label}</NavLink>
    )}</nav>
    <button type="button" className="btn btn-text lh-logout" onClick={onLogout}>
      <BoxArrowRight size={20} aria-hidden="true" />Log out
    </button>
  </div>
}
