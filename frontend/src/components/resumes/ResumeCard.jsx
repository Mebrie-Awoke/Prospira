import { CalendarDays, Download, Eye, Mail, Pencil, Phone, Tag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function displayDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function ResumeCard({ resume, onDelete }) {
  const skills = resume.skills_list || []
  const templateName = {
    classic: 'Classic Professional',
    'modern-blue': 'Modern Blue',
    minimalist: 'Minimalist',
    executive: 'Executive',
  }[resume.template_identifier] || 'Classic Professional'

  return (
    <article className="resume-card">
      <div className={`resume-cover resume-cover-${resume.template_identifier || 'classic'}`}>
        <strong>{resume.full_name || 'Your name'}</strong>
        <small>{resume.professional_title || templateName}</small>
        <i /><i /><i />
        <span>{templateName}</span>
      </div>
      <div className="resume-main">
        <div className="resume-heading-row"><h3>{resume.resume_title || `${resume.full_name} Resume`}</h3><span className="template-name">{templateName}</span></div>
        <div className="resume-meta"><span><Mail size={14} />{resume.email}</span>{resume.phone && <span><Phone size={14} />{resume.phone}</span>}</div>
        <p className="resume-education"><span className="meta-icon">ED</span>{resume.education_entries?.[0]?.degree || 'Education not added'}</p>
        <div className="skill-row"><Tag size={14} />{skills.length ? skills.slice(0, 4).map((skill) => <span key={skill} className="skill-chip">{skill}</span>) : <span className="muted">No skills added</span>}{skills.length > 4 && <span className="muted">+{skills.length - 4} more</span>}</div>
      </div>
      <div className="resume-date"><CalendarDays size={14} /><span>Updated {displayDate(resume.updated_at)}</span></div>
      <div className="resume-actions">
        <Link className="action-button action-view" to={`/resumes/${resume.id}`} aria-label={`Preview ${resume.resume_title || resume.full_name}`}><Eye size={15} /><span>Preview</span></Link>
        <Link className="action-button action-edit" to={`/resumes/${resume.id}/edit`} aria-label={`Edit ${resume.resume_title || resume.full_name}`}><Pencil size={14} /><span>Edit</span></Link>
        <Link className="action-button action-edit" to={`/resumes/${resume.id}?print=1`} aria-label={`Download ${resume.resume_title || resume.full_name} as PDF`}><Download size={14} /><span>PDF</span></Link>
        <button className="action-button action-delete" onClick={() => onDelete(resume)} aria-label={`Delete ${resume.resume_title || resume.full_name}`}><Trash2 size={14} /><span>Delete</span></button>
      </div>
    </article>
  )
}
