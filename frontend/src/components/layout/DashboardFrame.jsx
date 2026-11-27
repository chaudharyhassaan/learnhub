import { useState } from 'react'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { List } from 'react-bootstrap-icons'
import Sidebar from './Sidebar'

// The live dashboard and development preview share the responsive navigation shell.
export default function DashboardFrame({ user, title, onLogout, children }) {
  const [open, setOpen] = useState(false)
  return <div className="lh-dashboard">
    <Offcanvas responsive="lg" placement="start" show={open} onHide={() => setOpen(false)}
      className="lh-sidebar" id="dashboard-menu" aria-labelledby="drawer-title">
      <Offcanvas.Header closeButton><Offcanvas.Title id="drawer-title">Menu</Offcanvas.Title></Offcanvas.Header>
      <Offcanvas.Body><Sidebar role={user.role} onSelect={() => setOpen(false)} onLogout={onLogout} /></Offcanvas.Body>
    </Offcanvas>
    <div className="lh-workspace">
      <header className="lh-topbar">
        <button type="button" className="btn btn-outline-primary d-lg-none" aria-label="Open dashboard menu"
          aria-controls="dashboard-menu" aria-expanded={open} onClick={() => setOpen(true)}><List size={20} aria-hidden="true" /></button>
        <strong>{title}</strong><span>{user.name} · {user.role}</span>
      </header>
      <main className="lh-dashboard-main">{children}</main>
    </div>
  </div>
}
