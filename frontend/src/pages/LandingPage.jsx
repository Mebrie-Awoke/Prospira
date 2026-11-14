import { ArrowRight, Check, FileText, LayoutTemplate, ShieldCheck, Sparkles, Target, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const highlights = [
  { icon: LayoutTemplate, title: 'Thoughtful templates', text: 'Choose a clear, polished layout that helps recruiters find what matters.' },
  { icon: Target, title: 'Job-focused feedback', text: 'Understand how your experience aligns with the role you want.' },
  { icon: WandSparkles, title: 'AI writing assistance', text: 'Turn rough notes into sharper, more confident professional writing.' },
  { icon: ShieldCheck, title: 'Your work, in one place', text: 'Create, organize and revisit your resumes from a private workspace.' },
]

const steps = [
  ['01', 'Build your story', 'Add your experience, education, skills and projects in one guided editor.'],
  ['02', 'Make it yours', 'Choose a template and refine the details until the resume feels right.'],
  ['03', 'Move forward', 'Export your resume and use practical feedback to prepare for your next opportunity.'],
]

function Brand() {
  return <Link className="public-brand" to="/" aria-label="Prospira home"><span className="public-brand-mark"><Sparkles size={19} /></span><span>prospira</span></Link>
}

function ResumeMockup() {
  return (
    <div className="landing-preview-wrap" aria-label="Preview of a professionally formatted resume">
      <div className="landing-preview-glow" />
      <div className="landing-resume-paper">
        <div className="mock-resume-header">
          <div><span className="mock-name">Mebrie Awoke</span><span className="mock-role">SOFTWARE DEVELOPER</span></div>
          <span className="mock-monogram">MA</span>
        </div>
        <div className="mock-contact">mebrie.awoke@example.com&nbsp; · &nbsp;Addis Ababa&nbsp; · &nbsp;portfolio.example</div>
        <div className="mock-rule" />
        <section className="mock-section"><h4>PROFILE</h4><p>Product designer creating thoughtful digital experiences through research, systems thinking and close collaboration.</p></section>
        <section className="mock-section"><h4>EXPERIENCE</h4><div className="mock-entry"><b>Software Developer</b><span>Example Technology · 2022 — Present</span><i /><i /><i className="short" /></div><div className="mock-entry"><b>Backend Developer</b><span>Sample Projects · 2019 — 2022</span><i /><i className="short" /></div></section>
        <section className="mock-section"><h4>EDUCATION</h4><div className="mock-entry"><b>B.Sc. Information Systems</b><span>University Example · 2015 — 2019</span></div></section>
        <section className="mock-section"><h4>CORE SKILLS</h4><div className="mock-skills"><span>Python</span><span>Django</span><span>React</span><span>APIs</span></div></section>
      </div>
      <div className="landing-floating-note"><span><Check size={15} /></span><div><b>A clearer first impression</b><small>Thoughtful structure. Your real story.</small></div></div>
      <div className="landing-floating-label"><Sparkles size={14} /> Resume studio</div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="public-header">
        <div className="public-nav-inner">
          <Brand />
          <nav className="public-nav-links" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#templates-showcase">Templates</a>
          </nav>
          <div className="public-nav-actions">
            <Link className="public-login" to="/login">Log in</Link>
            <Link className="public-button public-button-small" to="/register">Get started <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow"><span /> A more considered way to build your career story</span>
            <h1>Your experience deserves a <em>stronger</em> presentation.</h1>
            <p className="landing-hero-description">Create a polished, professional resume with thoughtful templates and practical AI-powered guidance. Spend less time formatting and more time moving forward.</p>
            <div className="landing-hero-actions">
              <Link className="public-button" to="/register">Create your resume <ArrowRight size={17} /></Link>
              <a className="public-secondary-button" href="#templates-showcase"><LayoutTemplate size={17} /> Explore the approach</a>
            </div>
            <div className="landing-trust-line"><span><Check size={14} /></span> Start building for free <i /> No credit card required</div>
          </div>
          <ResumeMockup />
        </div>
        <div className="landing-hero-bottom"><span>DESIGNED FOR YOUR NEXT CHAPTER</span><span>CLARITY <b>·</b> CONFIDENCE <b>·</b> MOMENTUM</span></div>
      </section>

      <section className="landing-section landing-features" id="features">
        <div className="landing-section-heading">
          <span className="landing-eyebrow">A BETTER WAY TO GET READY</span>
          <h2>Everything you need to tell your story well.</h2>
          <p>Useful tools, considered design and guidance that keeps the focus on what you bring.</p>
        </div>
        <div className="landing-feature-grid">
          {highlights.map(({ icon: Icon, title, text }, index) => (
            <article className="landing-feature-card" key={title}>
              <span className="landing-feature-icon"><Icon size={21} /></span>
              <span className="landing-feature-number">0{index + 1}</span>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-templates" id="templates-showcase">
        <div className="landing-template-copy">
          <span className="landing-eyebrow">DESIGN WITH PURPOSE</span>
          <h2>Professional by design. Personal by nature.</h2>
          <p>A good resume makes your experience easy to understand. Prospira puts readability, structure and a confident visual hierarchy first.</p>
          <ul><li><Check size={16} /> Clean, recruiter-friendly layouts</li><li><Check size={16} /> Clear sections and readable typography</li><li><Check size={16} /> Flexible presentation for different careers</li></ul>
          <Link className="public-text-link" to="/register">Find your starting point <ArrowRight size={16} /></Link>
        </div>
        <div className="landing-template-stack" aria-hidden="true">
          <div className="landing-mini-paper mini-paper-back"><b>YOUR NAME</b><span /><span /><span /></div>
          <div className="landing-mini-paper mini-paper-front"><div><b>YOUR NAME</b><small>PROFESSIONAL TITLE</small></div><hr /><strong>EXPERIENCE</strong><span /><span /><strong>EDUCATION</strong><span /><strong>SKILLS</strong><div className="mini-tags"><i /><i /><i /></div></div>
          <div className="landing-template-caption"><FileText size={16} /> A resume that keeps the focus on you</div>
        </div>
      </section>

      <section className="landing-section landing-process" id="how-it-works">
        <div className="landing-section-heading">
          <span className="landing-eyebrow">SIMPLE FROM THE START</span>
          <h2>From experience to opportunity.</h2>
          <p>A clear process helps you focus on the content, not the formatting.</p>
        </div>
        <div className="landing-step-grid">{steps.map(([number, title, text]) => <article className="landing-step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="landing-cta">
        <div><span className="landing-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Make your next application your strongest yet.</h2><p>Build a resume that communicates your value with clarity.</p></div>
        <Link className="public-button public-button-light" to="/register">Start building <ArrowRight size={17} /></Link>
      </section>

      <footer className="public-footer">
        <div className="public-footer-main"><Brand /><p>Thoughtful tools to help you present your experience with clarity and confidence.</p></div>
        <div className="public-footer-links"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#templates-showcase">Templates</a><Link to="/login">Log in</Link><Link to="/register">Create account</Link></div>
        <div className="public-footer-bottom"><span>© {new Date().getFullYear()} Prospira. All rights reserved.</span><span>Build thoughtfully. Move confidently.</span></div>
      </footer>
    </main>
  )
}
