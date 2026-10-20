import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import Analyzer from './pages/Analyzer'
import Dashboard from './pages/Dashboard'
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
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
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
