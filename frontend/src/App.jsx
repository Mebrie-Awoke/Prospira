import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import Analyzer from './pages/Analyzer'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import MyResumes from './pages/MyResumes'
import PlaceholderPage from './pages/PlaceholderPage'
import ResumeDetail from './pages/ResumeDetail'
import ResumeBuilder from './pages/ResumeBuilder'
import Templates from './pages/Templates'

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
        <Route path="/resumes/new" element={<ResumeBuilder />} />
        <Route path="/resumes/:id" element={<ResumeDetail />} />
        <Route path="/resumes/:id/edit" element={<ResumeBuilder />} />
        <Route path="/profile" element={<PlaceholderPage type="profile" />} />
        <Route path="/settings" element={<PlaceholderPage type="settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>
}
