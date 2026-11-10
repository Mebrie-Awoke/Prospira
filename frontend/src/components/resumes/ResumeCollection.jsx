import { useDeferredValue, useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, FilePlus2, LoaderCircle, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resumesApi } from '../../api/resumes'
import { getApiError } from '../../utils/apiErrors'
import ResumeCard from './ResumeCard'

export default function ResumeCollection({ dashboard = false }) {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const deferredQuery = useDeferredValue(query)

  async function loadResumes() {
    setLoading(true)
    setError('')
    try {
      const data = await resumesApi.list()
      setResumes(Array.isArray(data) ? data : data.results || [])
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadResumes() }, [])

  async function removeResume() {
    if (!pendingDelete || deleting) return
    setDeleting(true)
    setError('')
    try {
      await resumesApi.remove(pendingDelete.id)
      setResumes((current) => current.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (requestError) {
      setError(getApiError(requestError))
      setPendingDelete(null)
    } finally {
      setDeleting(false)
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
        <div className="state-panel state-error" role="alert"><AlertCircle size={21} /><div><strong>We couldn't complete that request</strong><span>{error}</span></div><button className="button button-quiet" onClick={loadResumes}>Try again</button></div>
      ) : resumes.length === 0 ? (
        <div className="empty-state"><span className="empty-icon"><FilePlus2 size={23} /></span><h3>Your next resume starts here</h3><p>Choose a professional template and build your first resume.</p><Link to="/templates" className="button button-primary"><FilePlus2 size={16} /> Create a resume</Link></div>
      ) : matchingResumes.length === 0 ? (
        <div className="empty-state compact-empty"><span className="empty-icon"><Search size={22} /></span><h3>No matches found</h3><p>Try a different name, email, or skill.</p></div>
      ) : (
        <div className="resume-list">{displayedResumes.map((resume) => <ResumeCard key={resume.id} resume={resume} onDelete={setPendingDelete} />)}</div>
      )}
      {dashboard && matchingResumes.length > 3 && <Link className="view-all-link" to="/resumes">Browse all {matchingResumes.length} resumes <span>→</span></Link>}

      {pendingDelete && (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setPendingDelete(null) }}>
          <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="collection-delete-title" aria-describedby="collection-delete-description">
            <button className="dialog-close" type="button" aria-label="Close dialog" disabled={deleting} onClick={() => setPendingDelete(null)}><X size={18} /></button>
            <span className="dialog-icon dialog-icon-danger"><AlertTriangle size={22} /></span>
            <h2 id="collection-delete-title">Delete this resume?</h2>
            <p id="collection-delete-description">Permanently delete <strong>{pendingDelete.resume_title || pendingDelete.full_name}</strong>? This action cannot be undone.</p>
            <div className="dialog-actions">
              <button className="button button-quiet" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
              <button className="button button-danger" type="button" disabled={deleting} onClick={removeResume}>{deleting ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}{deleting ? 'Deleting…' : 'Delete permanently'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
