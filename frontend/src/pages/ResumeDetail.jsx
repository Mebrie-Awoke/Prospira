import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, Download, LoaderCircle, Pencil, Trash2, X } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { resumesApi } from '../api/resumes'
import { getApiError } from '../utils/apiErrors'
import ResumePreview from '../components/resumes/ResumePreview'
import { downloadResumePdf } from '../utils/downloadResumePdf'

export default function ResumeDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const downloadRequested = useRef(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    resumesApi.get(id)
      .then((data) => { if (active) setResume(data) })
      .catch((requestError) => { if (active) setError(getApiError(requestError)) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (resume && searchParams.get('download') === '1' && !downloadRequested.current) {
      downloadRequested.current = true
      downloadResumePdf(id, resume.resume_title || resume.full_name)
        .catch((requestError) => setError(getApiError(requestError)))
    }
  }, [id, resume, searchParams])

  async function handleDownload() {
    setError('')
    try {
      await downloadResumePdf(id, resume.resume_title || resume.full_name)
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  async function deleteResume() {
    setDeleting(true)
    setError('')
    try {
      await resumesApi.remove(id)
      navigate('/resumes', { replace: true, state: { notice: 'Resume deleted successfully.' } })
    } catch (requestError) {
      setError(getApiError(requestError))
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  if (error && !resume) return (
    <div className="state-panel state-error" role="alert">
      <div><strong>We couldn't load this resume</strong><span>{error}</span></div>
      <button className="button button-quiet" onClick={() => window.location.reload()}>Try again</button>
    </div>
  )
  if (!resume) return <div className="state-panel"><LoaderCircle className="spin" size={21} /><span>Loading resume…</span></div>

  return (
    <div className="detail-page">
      <div className="detail-topline">
        <Link to="/resumes" className="back-link"><ArrowLeft size={16} /> Back to resumes</Link>
        <div className="detail-actions">
          <Link to={`/resumes/${id}/edit`} className="button button-outline"><Pencil size={15} /> Edit resume</Link>
          <button onClick={handleDownload} className="button button-primary"><Download size={15} /> Download PDF</button>
          <button onClick={() => setConfirmDelete(true)} className="button button-danger"><Trash2 size={15} /> Delete</button>
        </div>
      </div>
      {notice && <div className="success-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="detail-preview-heading"><span className="eyebrow">RESUME PREVIEW</span><h1>{resume.resume_title || `${resume.full_name} Resume`}</h1></div>
      <div className="detail-resume-sheet"><ResumePreview resume={{ ...resume, skills_list: resume.skills_list?.length ? resume.skills_list : (resume.skills || '').split(/[,\r\n]/).map((skill) => skill.trim()).filter(Boolean) }} template={resume.template_identifier} /></div>

      {confirmDelete && (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setConfirmDelete(false) }}>
          <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <button className="dialog-close" type="button" aria-label="Close dialog" disabled={deleting} onClick={() => setConfirmDelete(false)}><X size={18} /></button>
            <span className="dialog-icon dialog-icon-danger"><AlertTriangle size={22} /></span>
            <h2 id="delete-title">Delete this resume?</h2>
            <p id="delete-description">You are about to permanently delete <strong>{resume.resume_title || resume.full_name}</strong>. This action cannot be undone.</p>
            <div className="dialog-actions">
              <button className="button button-quiet" type="button" disabled={deleting} onClick={() => setConfirmDelete(false)}>Keep resume</button>
              <button className="button button-danger" type="button" disabled={deleting} onClick={deleteResume}>{deleting ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}{deleting ? 'Deleting…' : 'Delete permanently'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
