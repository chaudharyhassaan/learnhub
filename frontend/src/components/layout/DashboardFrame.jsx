import { useState } from 'react'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { List } from 'react-bootstrap-icons'
import Sidebar from './Sidebar'
import DashboardSearch from './DashboardSearch'
import DashboardNotifications from './DashboardNotifications'
import getInitials from '../../utils/getInitials'
import '../../styles/portal.css'

// Bootstrap keeps keyboard focus inside the mobile navigation while it is open.
export default function DashboardFrame({ user, title, subtitle, onLogout, children }) {
  const [open, setOpen] = useState(false)
  return <div className="lh-dashboard">
    <a className="lh-skip-link" href="#main-content">Skip to content</a>
    <Offcanvas responsive="lg" placement="start" show={open} onHide={() => setOpen(false)}
      className="lh-sidebar" id="dashboard-menu" aria-labelledby="drawer-title">
      <Offcanvas.Header closeButton><Offcanvas.Title id="drawer-title">Menu</Offcanvas.Title></Offcanvas.Header>
      <Offcanvas.Body><Sidebar role={user.role} onSelect={() => setOpen(false)} onLogout={onLogout} /></Offcanvas.Body>
    </Offcanvas>
    <div className="lh-workspace">
      <header className="lh-topbar lh-portal-topbar">
        <button type="button" className="btn btn-outline-primary d-lg-none" aria-label="Open dashboard menu"
          aria-controls="dashboard-menu" aria-expanded={open} onClick={() => setOpen(true)}><List size={20} aria-hidden="true" /></button>
        <div className="lh-portal-heading">
          <strong>{title}</strong>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <DashboardSearch role={user.role} />
        <DashboardNotifications />
        <div className="lh-portal-profile">
          <span className="lh-avatar" aria-hidden="true">{getInitials(user.name)}</span>
          <div><strong>{user.name}</strong>
            {user.headline && <small>{user.headline}</small>}
            <small>{user.role}</small>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="lh-dashboard-main">{children}</main>
    </div>
  </div>
}
