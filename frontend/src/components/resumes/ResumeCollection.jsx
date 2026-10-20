import { useDeferredValue, useEffect, useState } from 'react'
import { AlertCircle, FilePlus2, LoaderCircle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resumesApi } from '../../api/resumes'
import ResumeCard from './ResumeCard'

export default function ResumeCollection({ dashboard = false }) {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  async function loadResumes() {
    setLoading(true)
    setError('')
    try {
      const data = await resumesApi.list()
      setResumes(Array.isArray(data) ? data : data.results || [])
    } catch (requestError) {
      setError(requestError.response?.status === 401 ? 'Your session expired. Sign in again to continue.' : 'We could not load resumes. Check that Django is running and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResumes()
  }, [])

  async function removeResume(resume) {
    if (!window.confirm(`Delete the resume for ${resume.full_name}? This cannot be undone.`)) return
    try {
      await resumesApi.remove(resume.id)
      setResumes((current) => current.filter((item) => item.id !== resume.id))
    } catch (requestError) {
      setError(requestError.response?.status === 401 ? 'Your session expired. Sign in again to continue.' : 'We could not delete this resume. Try again.')
    }
  }

  const matchingResumes = resumes.filter((resume) => {
    const haystack = `${resume.resume_title} ${resume.full_name} ${resume.email} ${(resume.skills_list || []).join(' ')}`.toLowerCase()
    return haystack.includes(deferredQuery.trim().toLowerCase())
  })
  const displayedResumes = dashboard ? matchingResumes.slice(0, 3) : matchingResumes

  return (
    <section className="collection-section">
      <div className="section-heading-row">
        <div><span className="eyebrow">YOUR CAREER LIBRARY</span><h2>{dashboard ? 'Your resumes' : 'My resumes'} <span className="count-badge">{resumes.length}</span></h2><p>{dashboard ? 'View and manage the resumes in your workspace.' : 'Search, review, and update resumes in your workspace.'}</p></div>
        <div className="section-actions">
          {!dashboard && <label className="search-control"><Search size={16} /><input aria-label="Search resumes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, skills" /></label>}
          <Link className="button button-primary" to="/templates"><FilePlus2 size={16} /> <span>{dashboard ? 'Create new resume' : 'New resume'}</span></Link>
        </div>
      </div>

      {loading ? <div className="state-panel"><LoaderCircle className="spin" size={22} /><span>Loading resumes…</span></div> : error ? (
        <div className="state-panel state-error"><AlertCircle size={21} /><div><strong>Couldn’t load your resumes</strong><span>{error}</span></div><button className="button button-quiet" onClick={loadResumes}>Try again</button></div>
      ) : resumes.length === 0 ? (
        <div className="empty-state"><span className="empty-icon"><FilePlus2 size={23} /></span><h3>Your next resume starts here</h3><p>Choose a professional template and build your first resume.</p><Link to="/templates" className="button button-primary"><FilePlus2 size={16} /> Create a resume</Link></div>
      ) : matchingResumes.length === 0 ? (
        <div className="empty-state compact-empty"><span className="empty-icon"><Search size={22} /></span><h3>No matches found</h3><p>Try a different name, email, or skill.</p></div>
      ) : (
        <div className="resume-list">{displayedResumes.map((resume) => <ResumeCard key={resume.id} resume={resume} onDelete={removeResume} />)}</div>
      )}
      {dashboard && matchingResumes.length > 3 && <Link className="view-all-link" to="/resumes">Browse all {matchingResumes.length} resumes <span>→</span></Link>}
    </section>
  )
}
