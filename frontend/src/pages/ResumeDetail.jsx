import { useEffect, useState } from 'react'
import { ArrowLeft, Download, LoaderCircle, Pencil, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { resumesApi } from '../api/resumes'
import { getApiError } from '../utils/apiErrors'
import ResumePreview from '../components/resumes/ResumePreview'
import { printResume } from '../utils/printResume'

export default function ResumeDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')

  useEffect(() => {
    resumesApi.get(id).then(setResume).catch((requestError) => setError(getApiError(requestError)))
  }, [id])

  useEffect(() => {
    if (resume && searchParams.get('print') === '1') {
      window.setTimeout(() => window.print(), 250)
    }
  }, [resume, searchParams])

  async function deleteResume() {
    if (!window.confirm(`Delete the resume for ${resume.full_name}? This cannot be undone.`)) return
    try {
      await resumesApi.remove(id)
      navigate('/resumes', { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  if (error) return <div className="state-panel state-error">{error}</div>
  if (!resume) return <div className="state-panel"><LoaderCircle className="spin" size={21} /><span>Loading resume…</span></div>

  return (
    <div className="detail-page">
      <div className="detail-topline"><Link to="/resumes" className="back-link"><ArrowLeft size={16} /> Back to resumes</Link><div className="detail-actions"><Link to={`/resumes/${id}/edit`} className="button button-outline"><Pencil size={15} /> Edit resume</Link><button onClick={printResume} className="button button-primary"><Download size={15} /> Download PDF</button><button onClick={deleteResume} className="button button-danger"><Trash2 size={15} /> Delete</button></div></div>
      {notice && <div className="success-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
      <div className="detail-preview-heading"><span className="eyebrow">RESUME PREVIEW</span><h1>{resume.resume_title || `${resume.full_name} Resume`}</h1></div>
      <div className="detail-resume-sheet"><ResumePreview resume={{ ...resume, skills_list: resume.skills_list?.length ? resume.skills_list : (resume.skills || '').split(/[,\n]/).map((skill) => skill.trim()).filter(Boolean) }} template={resume.template_identifier} /></div>
    </div>
  )
}
