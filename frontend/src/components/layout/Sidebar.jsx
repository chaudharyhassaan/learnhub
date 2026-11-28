import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Book, Bookshelf, BoxArrowRight, Calendar3, ChevronDown, Diagram3, Gear, GraphUp, Grid, Inbox, People, QuestionCircle, ClipboardCheck } from 'react-bootstrap-icons'
import Wordmark from './Wordmark'

const inbox = ['Inbox', '/dashboard/inbox', Inbox]
const schedule = ['Schedule', '/dashboard/schedule', Calendar3]
const paths = ['Learning Path', '/dashboard/learning-paths', Diagram3]
const footer = [
  ['Settings', '/dashboard/settings', Gear],
  ['Help & Support', '/dashboard/help', QuestionCircle],
]
const links = {
  student: [
    ['Dashboard', '/dashboard/student', Grid], inbox,
    ['My Courses', '/dashboard/student/courses', Book], schedule, paths,
  ],
  instructor: [
    ['Dashboard', '/dashboard/instructor', Grid], inbox,
    ['Course Builder', [
      ['My Courses', '/dashboard/instructor/courses', Bookshelf],
      ['Create Course', '/dashboard/instructor/courses/new', Book],
    ], Bookshelf],
    ['Evaluate Students', '/dashboard/instructor/evaluate', ClipboardCheck], schedule, paths,
    ['Tracking', [
      ['Courses', '/dashboard/instructor/tracking/courses', Book],
      ['Students', '/dashboard/instructor/tracking/students', People],
    ], GraphUp],
  ],
  admin: [
    ['Overview', '/dashboard/admin', Grid],
    ['Users', '/dashboard/admin/users', People],
    ['Courses', '/dashboard/admin/courses', Bookshelf], inbox,
  ],
}

function NavigationLink({ item, onSelect }) {
  const [label, to, Icon] = item
  return <NavLink to={to} end onClick={onSelect}><Icon size={20} aria-hidden="true" />{label}</NavLink>
}

// Open a section automatically when a user lands on one of its pages.
function NavigationGroup({ item, onSelect }) {
  const [label, links, Icon] = item
  const { pathname } = useLocation()
  const [expanded, setExpanded] = useState(null)
  const active = links.some(([, path]) => path === pathname) ||
    (label === 'Course Builder' && /^\/dashboard\/instructor\/courses\/.+\/edit$/.test(pathname))
  const open = expanded?.pathname === pathname ? expanded.open : active
  return <div>
    <button className="lh-nav-group" type="button" aria-expanded={open} onClick={() => setExpanded({ pathname, open: !open })}>
      <Icon size={20} aria-hidden="true" />{label}<ChevronDown className="lh-nav-chevron" size={16} aria-hidden="true" />
    </button>
    {open && <div className="lh-nav-children">{links.map(link => <NavigationLink key={link[1]} item={link} onSelect={onSelect} />)}</div>}
  </div>
}

// Desktop and mobile share the same role-specific navigation.
export default function Sidebar({ role, onSelect, onLogout }) {
  return <div className="lh-sidebar-content">
    <Wordmark onClick={onSelect} />
    <nav aria-label="Dashboard navigation">{links[role].map(item => (
      Array.isArray(item[1])
        ? <NavigationGroup key={item[0]} item={item} onSelect={onSelect} />
        : <NavigationLink key={item[1]} item={item} onSelect={onSelect} />
    ))}</nav>
    <nav className="lh-sidebar-footer" aria-label="Account navigation">
      {footer.map(item => <NavigationLink key={item[1]} item={item} onSelect={onSelect} />)}
      <button type="button" className="btn btn-text lh-logout" onClick={onLogout}>
        <BoxArrowRight size={20} aria-hidden="true" />Log Out
      </button>
    </nav>
  </div>
}
