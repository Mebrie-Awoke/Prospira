import { useNavigate } from 'react-router-dom'
import { FilePlus2 } from 'lucide-react'
import { resumesApi } from '../api/resumes'
import ResumeForm from '../components/resumes/ResumeForm'

export default function CreateResume() {
  const navigate = useNavigate()

  async function createResume(form) {
    const resume = await resumesApi.create(form)
    navigate(`/resumes/${resume.id}`, { replace: true, state: { notice: 'Resume created successfully.' } })
  }

  return (
    <div className="form-page">
      <div className="page-title-row"><span className="page-icon"><FilePlus2 size={20} /></span><div><span className="eyebrow">CAREER LIBRARY</span><h1>Create a resume</h1><p>Bring your professional story together in one place.</p></div></div>
      <ResumeForm submitLabel="Save resume" onSubmit={createResume} />
    </div>
  )
}
