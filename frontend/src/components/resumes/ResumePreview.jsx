function ContactLine({ resume, compact }) {
  const contact = [resume.email, resume.phone, resume.location]
    .filter(Boolean)
  const links = (resume.links || []).map((link) => link.url).filter(Boolean)
  return (
    <div className={`resume-preview-contact ${compact ? 'contact-compact' : ''}`}>
      {[...contact, ...links].map((item) => <span key={item}>{item}</span>)}
    </div>
  )
}

function Section({ title, children, className = '' }) {
  if (!children) return null
  return <section className={`preview-section ${className}`}><h3>{title}</h3>{children}</section>
}

function Experience({ entries = [], education = false }) {
  const fields = education
    ? ['degree', 'institution']
    : ['role', 'employer']
  return entries.filter((entry) => Object.values(entry).some(Boolean)).map((entry, index) => (
    <div className="preview-entry" key={`${entry.employer || entry.institution || entry.role || entry.degree}-${index}`}>
      <div className="preview-entry-heading">
        <strong>{[entry[fields[0]], entry[fields[1]]].filter(Boolean).join(' · ')}</strong>
        {(entry.start_date || entry.end_date) && <span>{[entry.start_date, entry.end_date].filter(Boolean).join(' – ')}</span>}
      </div>
      {entry.description && <p>{entry.description}</p>}
    </div>
  ))
}

export default function ResumePreview({ resume, template = 'classic', compact = false }) {
  const capabilities = templateCapabilities[template] || templateCapabilities.classic
  const profilePhoto = capabilities.supportsPhoto && resume.profile_photo_url
    ? <img className={`preview-profile-photo photo-${capabilities.photoShape}`} src={resume.profile_photo_url} alt="" />
    : null
  const skills = resume.skills_list || []
  const header = (
    <header className="preview-header">
      <div className="preview-header-copy">
        <h1>{resume.full_name || 'Your Name'}</h1>
        {resume.professional_title && <p className="preview-professional-title">{resume.professional_title}</p>}
        <ContactLine resume={resume} compact={compact} />
      </div>
      {profilePhoto}
    </header>
  )
  const summary = resume.professional_summary && <p className="preview-summary">{resume.professional_summary}</p>
  const experience = <Experience entries={resume.experience_entries} />
  const education = <Experience entries={resume.education_entries} education />
  const projects = (resume.projects || []).filter((project) => project.name || project.description).map((project, index) => (
    <div className="preview-entry" key={`${project.name}-${index}`}>
      <div className="preview-entry-heading"><strong>{project.name}</strong>{project.url && <span>{project.url}</span>}</div>
      {project.description && <p>{project.description}</p>}
    </div>
  ))
  const list = (items = []) => items.filter(Boolean).join('  ·  ')

  return (
    <article className={`resume-preview resume-template-${template} ${compact ? 'resume-preview-compact' : ''}`}>
      {template === 'modern-blue' ? (
        <>
          <div className="preview-blue-banner">{header}</div>
          <div className="preview-modern-layout">
            <div className="preview-main-column">
              <Section title="Profile">{summary}</Section>
              <Section title="Experience">{experience}</Section>
              <Section title="Selected projects">{projects}</Section>
              <Section title="Education">{education}</Section>
            </div>
            <aside className="preview-side-column">
              <Section title="Expertise"><div className="preview-skills">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></Section>
              <Section title="Certifications"><p>{list(resume.certifications)}</p></Section>
              <Section title="Languages"><p>{list(resume.languages)}</p></Section>
            </aside>
          </div>
        </>
      ) : template === 'minimalist' ? (
        <>
          <div className="preview-minimal-header">{header}{summary}</div>
          <div className="preview-minimal-columns">
            <div><Section title="Experience">{experience}</Section><Section title="Projects">{projects}</Section></div>
            <aside><Section title="Education">{education}</Section><Section title="Skills"><p>{list(skills)}</p></Section><Section title="Certifications"><p>{list(resume.certifications)}</p></Section><Section title="Languages"><p>{list(resume.languages)}</p></Section></aside>
          </div>
        </>
      ) : template === 'executive' ? (
        <>
          <header className="preview-executive-header"><div className="preview-executive-copy"><span className="preview-overline">PROFESSIONAL PROFILE</span>{header}</div>{profilePhoto || <div className="executive-mark">P</div>}</header>
          <div className="preview-executive-summary">{summary}</div>
          <div className="preview-executive-grid">
            <div><Section title="Career experience">{experience}</Section><Section title="Selected initiatives">{projects}</Section></div>
            <aside><Section title="Education">{education}</Section><Section title="Core strengths"><div className="preview-skills">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></Section><Section title="Credentials"><p>{list(resume.certifications)}</p></Section><Section title="Languages"><p>{list(resume.languages)}</p></Section></aside>
          </div>
        </>
      ) : (
        <>
          {header}
          <div className="preview-classic-body">
            <Section title="Professional Summary">{summary}</Section>
            <Section title="Professional Experience">{experience}</Section>
            <Section title="Education">{education}</Section>
            <Section title="Skills"><p>{list(skills)}</p></Section>
            <Section title="Projects">{projects}</Section>
            <Section title="Certifications"><p>{list(resume.certifications)}</p></Section>
            <Section title="Languages"><p>{list(resume.languages)}</p></Section>
          </div>
        </>
      )}
    </article>
  )
}
export const templateCapabilities = {
  classic: { supportsPhoto: true, photoShape: 'circle' },
  'modern-blue': { supportsPhoto: true, photoShape: 'circle' },
  minimalist: { supportsPhoto: false, photoShape: null },
  executive: { supportsPhoto: true, photoShape: 'square' },
}
