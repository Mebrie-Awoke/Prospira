import { Component } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import Analyzer from './pages/Analyzer'
import AnalysisHistory from './pages/AnalysisHistory'
import CoverLetterGenerator from './pages/CoverLetterGenerator'
import JobMatch from './pages/JobMatch'
import BillingPage from './pages/BillingPage'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import MyResumes from './pages/MyResumes'
import ResumeDetail from './pages/ResumeDetail'
import ResumeBuilder from './pages/ResumeBuilder'
import Templates from './pages/Templates'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Prospira interface error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
          <section style={{ maxWidth: 420, textAlign: 'center', padding: 32, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
            <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>We couldn't display this page. Please try again.</p>
            <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '11px 18px', border: 0, borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Reload page
            </button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <ProtectedLayout /> : <LandingPage />}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage mode="register" />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/resumes" element={<MyResumes />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/analysis-history" element={<AnalysisHistory />} />
        <Route path="/cover-letter" element={<CoverLetterGenerator />} />
        <Route path="/job-match" element={<JobMatch />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/resumes/new" element={<ResumeBuilder />} />
        <Route path="/resumes/:id" element={<ResumeDetail />} />
        <Route path="/resumes/:id/edit" element={<ResumeBuilder />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <ErrorBoundary><BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter></ErrorBoundary>
}
