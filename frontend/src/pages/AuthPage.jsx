import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, FileText, LoaderCircle, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getApiError } from '../utils/apiErrors'

export default function AuthPage({ mode }) {
  const isRegistering = mode === 'register'
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isRegistering) await register(form)
      else await login({ username: form.username, password: form.password })
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <div className="auth-visual-top"><span className="brand-mark"><Sparkles size={21} /></span><span><strong>Prospira</strong><small>Build. Apply. Grow.</small></span></div>
        <div className="auth-visual-content">
          <span className="eyebrow"><span /> YOUR NEXT CHAPTER</span>
          <h1>Put your next move <em>in motion.</em></h1>
          <p>A clear, confident resume is the start of a better opportunity. Build yours with Prospira.</p>
          <div className="auth-preview">
            <div className="preview-sheet"><span className="preview-icon"><FileText size={22} /></span><span className="preview-line preview-name" /><span className="preview-line" /><span className="preview-line short" /><span className="preview-rule" /><span className="preview-line" /><span className="preview-line medium" /><span className="preview-line" /></div>
            <span className="preview-stamp"><Sparkles size={15} /> Ready to grow</span>
          </div>
        </div>
        <span className="auth-visual-foot">CAREER DOCUMENTS, MADE CLEAR</span>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand"><span className="brand-mark"><Sparkles size={19} /></span><strong>Prospira</strong></div>
          <span className="eyebrow auth-eyebrow">{isRegistering ? 'START HERE' : 'WELCOME BACK'}</span>
          <h2>{isRegistering ? 'Create your account' : 'Sign in to Prospira'}</h2>
          <p className="auth-subtitle">{isRegistering ? 'Set up your workspace and start building.' : 'Your career workspace is ready when you are.'}</p>
          <form onSubmit={submit} className="auth-form">
            <label className="field"><span>Username</span><span className="input-icon"><UserRound size={16} /><input autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></span></label>
            {isRegistering && <label className="field"><span>Email address</span><span className="input-icon"><Mail size={16} /><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></span></label>}
            <label className="field"><span>Password</span><span className="input-icon"><LockKeyhole size={16} /><input type={showPassword ? 'text' : 'password'} autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength={isRegistering ? 8 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><button type="button" className="reveal-password" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            {isRegistering && <p className="auth-privacy-note">Your resumes are private to your account. For production, use HTTPS and secure server-side token handling.</p>}
            <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}{busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}</button>
          </form>
          <p className="auth-switch">{isRegistering ? 'Already registered?' : 'New to Prospira?'} <Link to={isRegistering ? '/login' : '/register'}>{isRegistering ? 'Sign in' : 'Create an account'}</Link></p>
        </div>
      </section>
    </main>
  )
}
