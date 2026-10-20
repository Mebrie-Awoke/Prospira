import { Check, FileText, Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ResumePreview from '../components/resumes/ResumePreview'

export const templates = [
  {
    id: 'classic',
    name: 'Classic Professional',
    description: 'A timeless, ATS-friendly format with a clear reading order and refined typography.',
  },
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Contemporary blue accents, confident hierarchy, and a dedicated skills rail.',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Elegant black-and-white styling with generous whitespace and quiet details.',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'A polished, editorial presentation designed for experienced leaders.',
  },
]

const sampleResume = {
  resume_title: 'Your next chapter',
  full_name: 'Jordan Morgan',
  professional_title: 'Senior Product Designer',
  email: 'jordan@example.com',
  phone: '+1 555 010 2400',
  location: 'New York, NY',
  links: [{ label: 'Portfolio', url: 'portfolio.example.com' }],
  professional_summary: 'Product designer shaping thoughtful digital experiences and building high-performing teams.',
  experience_entries: [{ employer: 'Northstar Studio', role: 'Lead Product Designer', start_date: '2021', end_date: 'Present', description: 'Led product design across a portfolio of customer experiences.' }],
  education_entries: [{ institution: 'Westbridge University', degree: 'BFA, Communication Design', start_date: '2012', end_date: '2016', description: '' }],
  skills_list: ['Product strategy', 'Design systems', 'User research', 'Prototyping'],
  projects: [],
  certifications: ['Certified UX Professional'],
  languages: ['English'],
}

export default function Templates() {
  const [searchParams] = useSearchParams()
  const selectedTemplate = searchParams.get('selected')
  return (
    <main className="templates-page">
      <div className="templates-heading">
        <span className="eyebrow">START WITH A STRONG FIRST IMPRESSION</span>
        <h1>Choose your resume template</h1>
        <p>Pick a layout to begin. You can change it any time without losing your information.</p>
      </div>
      <div className="template-grid">
        {templates.map((template) => (
          <Link
            className={`template-card ${selectedTemplate === template.id ? 'template-card-selected' : ''}`}
            key={template.id}
            to={`/resumes/new?template=${template.id}`}
            aria-label={`Choose ${template.name} template`}
            aria-current={selectedTemplate === template.id ? 'true' : undefined}
          >
            <div className="template-card-preview">
              <ResumePreview resume={sampleResume} template={template.id} compact />
            </div>
            <div className="template-card-copy">
              <div className="template-card-title"><span className="template-icon"><FileText size={17} /></span><h2>{template.name}</h2></div>
              <p>{template.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="template-note"><Sparkles size={16} /><span>Every template is built for clear, readable resumes and clean A4 printing.</span><span className="template-note-check"><Check size={14} /> Text-based PDF</span></div>
    </main>
  )
}
