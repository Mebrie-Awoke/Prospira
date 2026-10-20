import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FileText, House, Menu, Plus, Settings, UserRound, X, LogOut, ChevronDown, Sparkles, ScanSearch } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'

const navigation = [
  { label: 'Home', to: '/', icon: House, end: true },
  { label: 'My Resumes', to: '/resumes', icon: FileText },
  { label: 'Create Resume', to: '/templates', icon: Plus },
  { label: 'Resume Analyzer', to: '/analyzer', icon: ScanSearch },
  { label: 'Profile', to: '/profile', icon: UserRound },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const initials = username?.slice(0, 2).toUpperCase() || 'PR'

  function signOut() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-frame">
      {mobileOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <NavLink to="/" className="brand-lockup" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark"><Sparkles size={21} strokeWidth={2.5} /></span>
          <span><strong>Prospira</strong><small>Build. Apply. Grow.</small></span>
          <button className="mobile-close icon-button" aria-label="Close navigation" onClick={(event) => { event.preventDefault(); setMobileOpen(false) }}><X size={18} /></button>
        </NavLink>

        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Icon size={18} strokeWidth={2} /><span>{label}</span>
              {label === 'My Resumes' && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <section className="sidebar-promo">
          <div className="promo-art"><span className="promo-orbit" /><FileText size={45} strokeWidth={1.5} /><Sparkles className="promo-spark" size={18} /></div>
          <h2>Your next opportunity starts here</h2>
          <p>Make your experience easy to see and even easier to share.</p>
          <NavLink to="/templates" className="promo-link" onClick={() => setMobileOpen(false)}>Get started <span>→</span></NavLink>
        </section>
        <div className="sidebar-foot">PROSPIRA WORKSPACE <span>•</span> 2026</div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="topbar-context"><span className="context-mark"><FileText size={15} /></span><span>Career workspace</span></div>
          <div className="account-wrap">
            <button className="account-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>
              <span className="avatar">{initials}</span><span className="account-name">{username}</span><ChevronDown size={15} />
            </button>
            {menuOpen && <div className="account-menu"><NavLink to="/profile" onClick={() => setMenuOpen(false)}><UserRound size={15} /> Profile</NavLink><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>}
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}
