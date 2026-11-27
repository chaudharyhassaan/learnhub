import { useState } from 'react'
import Navbar from 'react-bootstrap/Navbar'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Wordmark from './Wordmark'

const copyrightYear = new Date().getFullYear()

// Public navigation follows the active session and closes after a mobile selection.
export default function PublicLayout() {
  const { user, logout } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const close = () => setExpanded(false)
  return <div className="lh-public">
    <header className="lh-nav-shell"><Navbar expand="lg" expanded={expanded} onToggle={setExpanded}
      className="container-narrow" aria-label="Main navigation">
      <div onClick={close}><Wordmark /></div>
      <Navbar.Toggle aria-controls="public-menu" />
      <Navbar.Collapse id="public-menu">
        <NavLink className="lh-nav-link" to="/courses" onClick={close}>Courses</NavLink>
        <div className="lh-account-links">
          {user ? <>
            <NavLink className="lh-nav-link" to="/dashboard" onClick={close}>Dashboard</NavLink>
            <button type="button" className="btn btn-text" onClick={() => { logout(); close() }}>Log out</button>
          </> : <>
            <NavLink className="lh-nav-link" to="/login" onClick={close}>Log in</NavLink>
            <NavLink className="btn btn-primary" to="/register" onClick={close}>Sign up</NavLink>
          </>}
        </div>
      </Navbar.Collapse>
    </Navbar></header>
    <main className="container-narrow lh-public-main"><Outlet /></main>
    <footer className="lh-footer"><div className="container-narrow">
      <Wordmark />
      <nav aria-label="Footer"><Link to="/courses">Courses</Link><Link to="/login">Log in</Link><Link to="/register">Sign up</Link></nav>
      <small>© {copyrightYear} LearnHub</small>
    </div></footer>
  </div>
}
