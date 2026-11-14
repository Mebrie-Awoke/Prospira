import { useState } from 'react'
import { Check, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react'
import { accountApi } from '../api/account'
import { getApiError } from '../utils/apiErrors'

export default function SettingsPage() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setNotice('')
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (form.new_password !== form.confirm_password) {
      setError('The new password and confirmation do not match.')
      return
    }
    if (form.new_password.length < 8) {
      setError('Your new password must contain at least 8 characters.')
      return
    }
    setSaving(true)
    try {
      const response = await accountApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      setNotice(response.detail || 'Your password has been updated.')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="account-settings-page">
      <div className="page-title-row">
        <span className="page-icon"><ShieldCheck size={20} /></span>
        <div><span className="eyebrow">ACCOUNT SECURITY</span><h1>Settings</h1><p>Manage your sign-in security and account preferences.</p></div>
      </div>
      <form className="account-form-card" onSubmit={submit}>
        <div className="account-form-heading"><span className="account-section-icon"><KeyRound size={18} /></span><div><h2>Change password</h2><p>Choose a unique password you do not use on other websites.</p></div></div>
        <div className="form-grid">
          <label className="field"><span>Current password</span><input type="password" autoComplete="current-password" value={form.current_password} onChange={(event) => update('current_password', event.target.value)} required /></label>
          <label className="field"><span>New password</span><input type="password" autoComplete="new-password" minLength={8} value={form.new_password} onChange={(event) => update('new_password', event.target.value)} required /></label>
          <label className="field"><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} value={form.confirm_password} onChange={(event) => update('confirm_password', event.target.value)} required /></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        {notice && <div className="success-notice" role="status"><Check size={15} /> {notice}</div>}
        <div className="account-form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <KeyRound size={15} />} {saving ? 'Updating…' : 'Update password'}</button></div>
      </form>
      <p className="account-security-note"><ShieldCheck size={15} /> Passwords are validated by the server using Django's configured password validators.</p>
    </main>
  )
}
