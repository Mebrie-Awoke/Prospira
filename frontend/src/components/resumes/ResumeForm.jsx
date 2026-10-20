import { useEffect, useState } from 'react'
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiError } from '../../utils/apiErrors'

const fields = [
  { name: 'full_name', label: 'Full name', required: true, placeholder: 'e.g. Amara Bekele' },
  { name: 'email', label: 'Email address', type: 'email', required: true, placeholder: 'you@example.com' },
  { name: 'phone', label: 'Phone number', placeholder: '+251 91 000 0000' },
]

const initialForm = {
  full_name: '', email: '', phone: '', professional_summary: '', education: '', experience: '', skills: '',
}

export default function ResumeForm({ initialValues, submitLabel, onSubmit }) {
  const [form, setForm] = useState({ ...initialForm, ...initialValues })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({ ...initialForm, ...initialValues })
  }, [initialValues])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (submissionError) {
      setError(getApiError(submissionError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="resume-form" onSubmit={handleSubmit}>
      <div className="form-grid form-grid-three">
        {fields.map(({ name, label, type = 'text', required, placeholder }) => (
          <label className="field" key={name}>
            <span>{label}{required && <span className="required-mark"> *</span>}</span>
            <input name={name} type={type} value={form[name]} onChange={updateField} placeholder={placeholder} required={required} maxLength={name === 'full_name' ? 150 : undefined} />
          </label>
        ))}
      </div>
      <label className="field">
        <span>Professional summary</span>
        <textarea name="professional_summary" value={form.professional_summary} onChange={updateField} placeholder="A concise introduction to your professional experience and strengths." rows={4} />
      </label>
      <div className="form-grid form-grid-two">
        <label className="field">
          <span>Education</span>
          <textarea name="education" value={form.education} onChange={updateField} placeholder="Degree, institution, and dates" rows={4} />
        </label>
        <label className="field">
          <span>Experience</span>
          <textarea name="experience" value={form.experience} onChange={updateField} placeholder="Roles, organizations, and achievements" rows={4} />
        </label>
      </div>
      <label className="field">
        <span>Skills</span>
        <textarea name="skills" value={form.skills} onChange={updateField} placeholder="Separate skills with commas" rows={3} />
        <small>Separate each skill with a comma.</small>
      </label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="form-footer">
        <Link to="/" className="button button-quiet"><ArrowLeft size={16} /> Cancel</Link>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={16} />}
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
