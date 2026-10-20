import { ArrowRight, BriefcaseBusiness, FileText, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import ResumeCollection from '../components/resumes/ResumeCollection'

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-kicker"><Sparkles size={14} /> CAREER MOMENTUM STARTS HERE</span>
          <h1>Welcome to <span>Prospira</span></h1>
          <p>Create, manage, and showcase your professional resume with ease. Take the next step in your career journey.</p>
          <Link to="/templates" className="button button-primary hero-button">Create your resume <ArrowRight size={16} /></Link>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1100&q=85" alt="Professional reviewing career documents at a desk" />
          <div className="hero-float-card"><span className="float-icon"><FileText size={19} /></span><span><strong>Make your next move</strong><small>One clear story at a time</small></span><Sparkles size={15} /></div>
          <span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" />
        </div>
        <div className="hero-ribbon"><BriefcaseBusiness size={14} /> BUILD <span>•</span> APPLY <span>•</span> GROW</div>
      </section>

      <div className="dashboard-intro"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>Make your experience visible.</h2></div><div className="workspace-stat"><span><UsersRound size={17} /></span><small>Personal workspace<strong>Private</strong></small></div></div>
      <ResumeCollection dashboard />
    </div>
  )
}
