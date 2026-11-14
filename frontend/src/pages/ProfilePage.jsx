import { useEffect, useState } from 'react'
import { Check, LoaderCircle, Save, UserRound } from 'lucide-react'
import { accountApi } from '../api/account'
import { getApiError } from '../utils/apiErrors'

export default function ProfilePage() {
  const [profile, setProfile] = useState({ username: '', first_name: '', last_name: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    accountApi.getProfile()
      .then((data) => setProfile(data))
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setLoading(false))
  }, [])

  function update(key, value) {
    setProfile((current) => ({ ...current, [key]: value }))
    setNotice('')
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const data = await accountApi.updateProfile({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        email: profile.email.trim(),
      })
      setProfile(data)
      setNotice('Your profile has been updated.')
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="account-settings-page">
      <div className="page-title-row">
        <span className="page-icon"><UserRound size={20} /></span>
        <div><span className="eyebrow">YOUR ACCOUNT</span><h1>Profile</h1><p>Keep your account details accurate and up to date.</p></div>
      </div>
      {loading ? <div className="state-panel"><LoaderCircle className="spin" size={20} /> Loading your profile…</div> : (
        <form className="account-form-card" onSubmit={save}>
          <div className="account-form-heading"><h2>Personal details</h2><p>Your username identifies your account and cannot currently be changed.</p></div>
          <div className="form-grid form-grid-two">
            <label className="field"><span>Username</span><input value={profile.username} readOnly disabled /></label>
            <label className="field"><span>Email address</span><input type="email" value={profile.email} onChange={(event) => update('email', event.target.value)} required /></label>
            <label className="field"><span>First name</span><input value={profile.first_name} onChange={(event) => update('first_name', event.target.value)} autoComplete="given-name" /></label>
            <label className="field"><span>Last name</span><input value={profile.last_name} onChange={(event) => update('last_name', event.target.value)} autoComplete="family-name" /></label>
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          {notice && <div className="success-notice" role="status"><Check size={15} /> {notice}</div>}
          <div className="account-form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />} {saving ? 'Saving…' : 'Save changes'}</button></div>
        </form>
      )}
    </main>
  )
}
