import { useEffect, useState } from 'react'
import { Check, Copy, FileText, LoaderCircle, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react'
import { analyzerApi } from '../api/analyzer'
import { getApiError } from '../utils/apiErrors'

export default function CoverLetterGenerator() {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [tone, setTone] = useState('professional')
  const [title, setTitle] = useState('')
  const [letters, setLetters] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadLetters() {
    try {
      const data = await analyzerApi.getCoverLetters()
      setLetters(Array.isArray(data) ? data : data.results || [])
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  useEffect(() => { loadLetters() }, [])

  async function generate(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const letter = await analyzerApi.generateCoverLetter({
        resume_text: resumeText,
        job_description: jobDescription,
        tone,
        title: title.trim() || 'Mebrie Awoke — Cover Letter',
      })
      setActive(letter)
      setLetters((current) => [letter, ...current.filter((item) => item.id !== letter.id)])
      setNotice('Your cover letter has been generated and saved.')
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  async function saveEdits() {
    if (!active) return
    setSaving(true)
    setError('')
    try {
      const updated = await analyzerApi.updateCoverLetter(active.id, {
        title: active.title,
        content: active.content,
      })
      setActive(updated)
      setLetters((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice('Your edits have been saved.')
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function removeLetter(id) {
    if (!window.confirm('Delete this cover letter?')) return
    try {
      await analyzerApi.deleteCoverLetter(id)
      setLetters((current) => current.filter((item) => item.id !== id))
      if (active?.id === id) setActive(null)
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  async function copyLetter() {
    if (!active?.content) return
    try {
      await navigator.clipboard.writeText(active.content)
      setNotice('Cover letter copied to clipboard.')
    } catch {
      setError('Clipboard access was blocked by your browser. Select and copy the text manually.')
    }
  }

  return (
    <main className="cover-letter-page">
      <header className="page-title-row">
        <span className="page-icon"><FileText size={20} /></span>
        <div><span className="eyebrow">AI CAREER TOOLS</span><h1>Cover letter generator</h1><p>Create a tailored first draft grounded in your actual experience.</p></div>
      </header>
      <div className="cover-letter-privacy">Your resume details and job description are sent to Groq for generation. Prospira saves only the generated letter, not the source text.</div>
      <div className="cover-letter-layout">
        <form className="account-form-card cover-letter-form" onSubmit={generate}>
          <div className="account-form-heading"><span className="account-section-icon"><Sparkles size={18} /></span><div><h2>Build your letter</h2><p>Give the AI evidence to work with. It must not invent experience.</p></div></div>
          <label className="field"><span>Resume details</span><textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} rows={10} maxLength={20000} placeholder="Paste your resume text here. Include your experience, education, projects, and skills." required /></label>
          <label className="field"><span>Target job description</span><textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={8} maxLength={12000} placeholder="Paste the job description for the role you are applying to." required /></label>
          <label className="field"><span>Document title</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Mebrie Awoke — Software Engineer Application" /></label>
          <label className="field"><span>Writing tone</span><select value={tone} onChange={(event) => setTone(event.target.value)}><option value="professional">Professional</option><option value="confident">Confident</option><option value="warm">Warm and personable</option></select></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          {notice && <div className="success-notice" role="status"><Check size={14} /> {notice}</div>}
          <button className="button button-primary" type="submit" disabled={loading || !resumeText.trim() || !jobDescription.trim()}>{loading ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />} {loading ? 'Writing your letter…' : 'Generate cover letter'}</button>
        </form>
        <section className="cover-letter-output">
          <div className="cover-letter-output-head"><div><span className="eyebrow">YOUR DRAFT</span><h2>{active?.title || 'Your cover letter will appear here'}</h2></div>{active && <div className="cover-letter-output-actions"><button className="button button-outline" type="button" onClick={copyLetter}><Copy size={14} /> Copy</button><button className="button button-primary" type="button" onClick={saveEdits} disabled={saving}>{saving ? <LoaderCircle className="spin" size={14} /> : <Save size={14} />} Save edits</button></div>}</div>
          {active ? <><input className="cover-letter-title-edit" aria-label="Edit cover letter title" value={active.title} onChange={(event) => setActive((current) => ({ ...current, title: event.target.value }))} /><textarea className="cover-letter-editor" aria-label="Edit generated cover letter" value={active.content} onChange={(event) => setActive((current) => ({ ...current, content: event.target.value }))} rows={25} /></> : <div className="empty-state"><span className="empty-icon"><FileText size={22} /></span><h2>Ready when you are</h2><p>Submit your resume details and a job description to create a personalized draft.</p></div>}
        </section>
      </div>
      <section className="cover-letter-library"><div className="cover-letter-library-heading"><h2>Saved cover letters</h2><span>{letters.length} saved</span></div>
        {letters.length ? <div className="cover-letter-list">{letters.map((letter) => <article key={letter.id} className={active?.id === letter.id ? 'cover-letter-list-item active' : 'cover-letter-list-item'}><button type="button" onClick={() => setActive(letter)}><strong>{letter.title}</strong><small>{new Date(letter.updated_at).toLocaleDateString()}</small></button><button className="icon-button" type="button" aria-label={`Delete ${letter.title}`} onClick={() => removeLetter(letter.id)}><Trash2 size={15} /></button></article>)}</div> : <p className="cover-letter-empty">Your generated letters will be listed here.</p>}
      </section>
    </main>
  )
}
