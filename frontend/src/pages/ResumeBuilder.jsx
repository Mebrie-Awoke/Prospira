import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { resumesApi } from '../api/resumes'
import { getApiError } from '../utils/apiErrors'
import ResumePreview, { templateCapabilities } from '../components/resumes/ResumePreview'
import ProfilePhotoEditor from '../components/resumes/ProfilePhotoEditor'
import { printResume } from '../utils/printResume'
import { templates } from './Templates'

const emptyResume = {
  resume_title: '',
  template_identifier: 'classic',
  full_name: '',
  email: '',
  phone: '',
  location: '',
  professional_title: '',
  links: [],
  professional_summary: '',
  experience_entries: [],
  education_entries: [],
  skills_list: [],
  projects: [],
  certifications: [],
  languages: [],
  profile_photo_url: '',
}

const sections = [
  ['personal', 'Personal information'],
  ['summary', 'Professional summary'],
  ['experience', 'Work experience'],
  ['education', 'Education'],
  ['skills', 'Skills'],
  ['projects', 'Projects'],
  ['credentials', 'Credentials & languages'],
]

const experienceFields = [
  ['role', 'Job title'], ['employer', 'Employer'], ['start_date', 'Start date'], ['end_date', 'End date'],
]
const educationFields = [
  ['degree', 'Degree or qualification'], ['institution', 'Institution'], ['start_date', 'Start date'], ['end_date', 'End date'],
]

function normalizeResume(resume = {}) {
  return {
    ...emptyResume,
    ...resume,
    resume_title: resume.resume_title || `${resume.full_name || ''} Resume`.trim(),
    template_identifier: resume.template_identifier || 'classic',
    skills_list: resume.skills_list?.length ? resume.skills_list : (resume.skills || '').split(/[,\n]/).map((skill) => skill.trim()).filter(Boolean),
    experience_entries: resume.experience_entries?.length ? resume.experience_entries : (resume.experience ? [{ description: resume.experience }] : []),
    education_entries: resume.education_entries?.length ? resume.education_entries : (resume.education ? [{ description: resume.education }] : []),
  }
}

function EntryList({ title, items, fields, onChange, onAdd, onRemove, addLabel }) {
  return (
    <div className="builder-entry-list">
      {items.map((entry, index) => (
        <section className="builder-entry" key={index}>
          <div className="builder-entry-heading"><strong>{title} {index + 1}</strong><button className="entry-remove" type="button" onClick={() => onRemove(index)} aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}><Trash2 size={15} /> Remove</button></div>
          <div className="builder-fields-grid">
            {fields.map(([key, label]) => (
              <label className={`field ${key === 'description' ? 'field-full' : ''}`} key={key}>
                <span>{label}</span>
                {key === 'description' ? <textarea rows={4} value={entry[key] || ''} onChange={(event) => onChange(index, key, event.target.value)} /> : <input value={entry[key] || ''} onChange={(event) => onChange(index, key, event.target.value)} />}
              </label>
            ))}
          </div>
        </section>
      ))}
      <button className="button button-outline builder-add" type="button" onClick={onAdd}><Plus size={15} /> {addLabel}</button>
    </div>
  )
}

function TextCollection({ title, items, onChange, onAdd, onRemove, placeholder }) {
  return (
    <div className="builder-entry-list">
      {items.map((item, index) => (
        <div className="builder-inline-entry" key={index}>
          <label className="field"><span>{title} {index + 1}</span><input value={item} onChange={(event) => onChange(index, event.target.value)} placeholder={placeholder} /></label>
          <button type="button" className="entry-remove" onClick={() => onRemove(index)} aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}><Trash2 size={15} /></button>
        </div>
      ))}
      <button className="button button-outline builder-add" type="button" onClick={onAdd}><Plus size={15} /> Add {title.toLowerCase()}</button>
    </div>
  )
}

export default function ResumeBuilder() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const selectedTemplate = searchParams.get('template')
  const [resume, setResume] = useState(() => ({ ...emptyResume, template_identifier: templates.some((item) => item.id === selectedTemplate) ? selectedTemplate : 'classic' }))
  const [activeSection, setActiveSection] = useState('personal')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pendingPhoto, setPendingPhoto] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [photoRemoved, setPhotoRemoved] = useState(false)

  useEffect(() => {
    if (!id) return
    resumesApi.get(id).then((data) => setResume(normalizeResume(data))).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false))
  }, [id])

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
  }, [photoPreviewUrl])

  const currentIndex = useMemo(() => sections.findIndex(([key]) => key === activeSection), [activeSection])
  function update(key, value) {
    setResume((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }
  function updateEntry(group, index, key, value) {
    update(group, resume[group].map((entry, itemIndex) => itemIndex === index ? { ...entry, [key]: value } : entry))
  }
  function changeTextItem(group, index, value) {
    update(group, resume[group].map((item, itemIndex) => itemIndex === index ? value : item))
  }
  function addEntry(group, value) {
    update(group, [...resume[group], value])
  }
  function removeEntry(group, index) {
    update(group, resume[group].filter((_, itemIndex) => itemIndex !== index))
  }

  async function save(event) {
    event.preventDefault()
    if (!resume.full_name.trim() || !resume.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.email)) {
      setError('Enter your full name and a valid email address in Personal information before saving.')
      setActiveSection('personal')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...resume,
        profile_photo_url: undefined,
        resume_title: resume.resume_title.trim() || `${resume.full_name.trim()} Resume`,
        skills: resume.skills_list.join(', '),
        experience: resume.experience_entries.map((entry) => entry.description).filter(Boolean).join('\n\n'),
        education: resume.education_entries.map((entry) => [entry.degree, entry.institution, entry.description].filter(Boolean).join(' — ')).filter(Boolean).join('\n\n'),
      }
      let result = id ? await resumesApi.update(id, payload) : await resumesApi.create(payload)
      if (pendingPhoto) {
        result = await resumesApi.uploadPhoto(result.id, pendingPhoto)
        setPendingPhoto(null)
      } else if (photoRemoved && result.profile_photo_url) {
        result = await resumesApi.removePhoto(result.id)
      }
      setPhotoRemoved(false)
      setResume(normalizeResume({ ...result, profile_photo_url: result.profile_photo_url || '' }))
      setSaved(true)
      if (!id) navigate(`/resumes/${result.id}/edit`, { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  function applyPhoto(blob, previewUrl) {
    setPendingPhoto(new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' }))
    setPhotoPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return previewUrl
    })
    setPhotoRemoved(false)
    update('profile_photo_url', previewUrl)
  }

  function removePhoto() {
    setPhotoPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return ''
    })
    setPendingPhoto(null)
    update('profile_photo_url', '')
    setPhotoRemoved(Boolean(id))
  }

  async function downloadPdf() {
    await printResume()
  }

  const templatePhoto = templateCapabilities[resume.template_identifier] || templateCapabilities.classic
  const photoUrl = photoPreviewUrl || (photoRemoved ? '' : resume.profile_photo_url)

  if (loading) return <div className="state-panel"><LoaderCircle className="spin" size={21} /><span>Loading resume…</span></div>

  return (
    <div className="builder-page">
      <div className="builder-topline">
        <div><Link to={id ? `/resumes/${id}` : `/templates?selected=${resume.template_identifier}`} className="back-link"><ArrowLeft size={15} /> {id ? 'Resume details' : 'Change template'}</Link><h1>{id ? 'Edit your resume' : 'Build your resume'}</h1><p>Work through each section. Your preview updates as you type.</p></div>
        <div className="builder-top-actions">
          <select aria-label="Resume template" value={resume.template_identifier} onChange={(event) => update('template_identifier', event.target.value)}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
          <button className="button button-outline" type="button" onClick={downloadPdf}><Download size={15} /> Download PDF</button>
          <button className="button button-primary" type="submit" form="resume-builder-form" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : saved ? <Check size={15} /> : <Save size={15} />}{saving ? 'Saving…' : saved ? 'Saved' : 'Save resume'}</button>
        </div>
      </div>

      <div className="builder-layout">
        <form id="resume-builder-form" className="builder-form" onSubmit={save}>
          <nav className="builder-steps" aria-label="Resume sections">
            {sections.map(([key, label], index) => <button type="button" key={key} className={activeSection === key ? 'step-active' : index < currentIndex ? 'step-complete' : ''} onClick={() => setActiveSection(key)}><span>{index < currentIndex ? <Check size={13} /> : index + 1}</span>{label}</button>)}
          </nav>
          <div className="builder-section">
            {activeSection === 'personal' && <>
              <div className="builder-section-heading"><span className="eyebrow">THE BASICS</span><h2>Personal information</h2><p>Help employers reach you and understand what you do.</p></div>
              <label className="field"><span>Resume title</span><input value={resume.resume_title} onChange={(event) => update('resume_title', event.target.value)} placeholder="e.g. Product designer resume" /></label>
              <div className="builder-fields-grid">
                {[['full_name', 'Full name'], ['professional_title', 'Professional title'], ['email', 'Email address'], ['phone', 'Phone number'], ['location', 'Location']].map(([key, label]) => <label className="field" key={key}><span>{label}{['full_name', 'email'].includes(key) && <em> required</em>}</span><input name={key} type={key === 'email' ? 'email' : 'text'} value={resume[key]} onChange={(event) => update(key, event.target.value)} required={['full_name', 'email'].includes(key)} placeholder={key === 'location' ? 'City, Country' : ''} /></label>)}
              </div>
              <h3 className="builder-subheading">Professional links</h3>
              <div className="builder-entry-list">
                {resume.links.map((link, index) => <div className="builder-link-row" key={index}><label className="field"><span>Label</span><input value={link.label || ''} onChange={(event) => updateEntry('links', index, 'label', event.target.value)} placeholder="LinkedIn" /></label><label className="field"><span>URL</span><input type="url" value={link.url || ''} onChange={(event) => updateEntry('links', index, 'url', event.target.value)} placeholder="https://" /></label><button type="button" className="entry-remove" aria-label="Remove link" onClick={() => removeEntry('links', index)}><Trash2 size={15} /></button></div>)}
                <button className="button button-outline builder-add" type="button" onClick={() => addEntry('links', { label: '', url: '' })}><Plus size={15} /> Add a link</button>
              </div>
              {templatePhoto.supportsPhoto && <ProfilePhotoEditor photoUrl={photoUrl} shape={templatePhoto.photoShape} onApply={applyPhoto} onRemove={removePhoto} />}
            </>}
            {activeSection === 'summary' && <><div className="builder-section-heading"><span className="eyebrow">YOUR INTRODUCTION</span><h2>Professional summary</h2><p>Write a concise overview of your experience, strengths, and direction.</p></div><label className="field"><span>Summary</span><textarea rows={8} maxLength={1800} value={resume.professional_summary} onChange={(event) => update('professional_summary', event.target.value)} placeholder="Summarize your professional strengths and the impact you bring." /><small>{resume.professional_summary.length}/1800 characters</small></label></>}
            {activeSection === 'experience' && <><div className="builder-section-heading"><span className="eyebrow">YOUR CAREER STORY</span><h2>Work experience</h2><p>List roles in reverse chronological order, emphasizing results and impact.</p></div><EntryList title="Position" items={resume.experience_entries} fields={[...experienceFields, ['description', 'Description and achievements']]} onChange={(index, key, value) => updateEntry('experience_entries', index, key, value)} onAdd={() => addEntry('experience_entries', { employer: '', role: '', start_date: '', end_date: '', description: '' })} onRemove={(index) => removeEntry('experience_entries', index)} addLabel="Add work experience" /></>}
            {activeSection === 'education' && <><div className="builder-section-heading"><span className="eyebrow">YOUR EDUCATION</span><h2>Education</h2><p>Add degrees, training, or other relevant qualifications.</p></div><EntryList title="Education" items={resume.education_entries} fields={[...educationFields, ['description', 'Details']]} onChange={(index, key, value) => updateEntry('education_entries', index, key, value)} onAdd={() => addEntry('education_entries', { institution: '', degree: '', start_date: '', end_date: '', description: '' })} onRemove={(index) => removeEntry('education_entries', index)} addLabel="Add education" /></>}
            {activeSection === 'skills' && <><div className="builder-section-heading"><span className="eyebrow">WHAT YOU BRING</span><h2>Skills</h2><p>Add relevant tools, strengths, and areas of expertise.</p></div><TextCollection title="Skill" items={resume.skills_list} onChange={(index, value) => changeTextItem('skills_list', index, value)} onAdd={() => addEntry('skills_list', '')} onRemove={(index) => removeEntry('skills_list', index)} placeholder="e.g. Product strategy" /></>}
            {activeSection === 'projects' && <><div className="builder-section-heading"><span className="eyebrow">SELECTED WORK</span><h2>Projects</h2><p>Showcase relevant work, outcomes, and portfolio links.</p></div><EntryList title="Project" items={resume.projects} fields={ [['name', 'Project name'], ['url', 'Project URL'], ['description', 'Description']] } onChange={(index, key, value) => updateEntry('projects', index, key, value)} onAdd={() => addEntry('projects', { name: '', url: '', description: '' })} onRemove={(index) => removeEntry('projects', index)} addLabel="Add project" /></>}
            {activeSection === 'credentials' && <><div className="builder-section-heading"><span className="eyebrow">ADDITIONAL CREDENTIALS</span><h2>Certifications & languages</h2><p>Include additional qualifications that strengthen your profile.</p></div><h3 className="builder-subheading">Certifications</h3><TextCollection title="Certification" items={resume.certifications} onChange={(index, value) => changeTextItem('certifications', index, value)} onAdd={() => addEntry('certifications', '')} onRemove={(index) => removeEntry('certifications', index)} placeholder="Certification name" /><h3 className="builder-subheading">Languages</h3><TextCollection title="Language" items={resume.languages} onChange={(index, value) => changeTextItem('languages', index, value)} onAdd={() => addEntry('languages', '')} onRemove={(index) => removeEntry('languages', index)} placeholder="Language and proficiency" /></>}
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="builder-footer"><button type="button" className="button button-quiet" disabled={currentIndex <= 0} onClick={() => setActiveSection(sections[currentIndex - 1][0])}><ArrowLeft size={15} /> Previous</button><span>Section {currentIndex + 1} of {sections.length}</span><button type="button" className="button button-outline" disabled={currentIndex >= sections.length - 1} onClick={() => setActiveSection(sections[currentIndex + 1][0])}>Next <ArrowRight size={15} /></button></div>
        </form>
        <aside className="builder-preview-panel">
          <div className="preview-panel-heading"><div><span className="eyebrow">LIVE PREVIEW</span><strong>{templates.find((item) => item.id === resume.template_identifier)?.name}</strong></div><span className="live-indicator" /></div>
          <ResumePreview resume={resume} template={resume.template_identifier} />
        </aside>
      </div>
    </div>
  )
}
