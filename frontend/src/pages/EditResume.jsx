import { useEffect, useState } from 'react'
import { LoaderCircle, Pencil } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { resumesApi } from '../api/resumes'
import { getApiError } from '../components/resumes/ResumeForm'
import ResumeForm from '../components/resumes/ResumeForm'

export default function EditResume() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    resumesApi.get(id).then(setResume).catch((requestError) => setError(getApiError(requestError)))
  }, [id])

  async function updateResume(form) {
    const updated = await resumesApi.update(id, form)
    navigate(`/resumes/${updated.id}`, { replace: true, state: { notice: 'Resume changes saved.' } })
  }

  if (error) return <div className="state-panel state-error"><span>{error}</span></div>
  if (!resume) return <div className="state-panel"><LoaderCircle className="spin" size={21} /><span>Loading resume…</span></div>

  return (
    <div className="form-page">
      <div className="page-title-row"><span className="page-icon"><Pencil size={19} /></span><div><span className="eyebrow">UPDATE DETAILS</span><h1>Edit resume</h1><p>Keep your professional profile current.</p></div></div>
      <ResumeForm key={resume.id} initialValues={resume} submitLabel="Save changes" onSubmit={updateResume} />
    </div>
  )
}
