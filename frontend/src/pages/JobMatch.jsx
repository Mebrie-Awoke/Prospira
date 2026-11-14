import { useState } from 'react'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, LoaderCircle, ScanSearch, Sparkles, Target } from 'lucide-react'
import { analyzerApi } from '../api/analyzer'
import { getApiError } from '../utils/apiErrors'

export default function JobMatch() {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function compare(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await analyzerApi.analyze({
        resume_text: resumeText.trim(),
        job_description: jobDescription.trim(),
      })
      setResult(data)
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="job-match-page">
      <header className="page-title-row"><span className="page-icon"><Target size={20} /></span><div><span className="eyebrow">CAREER DEVELOPMENT</span><h1>Job match</h1><p>See how clearly your resume supports a specific job's requirements.</p></div></header>
      <div className="job-match-disclaimer">This is an evidence-based text comparison, not a prediction of hiring success. Skills not found in the resume text may still be skills you have.</div>
      <div className="job-match-layout">
        <form className="account-form-card" onSubmit={compare}>
          <div className="account-form-heading"><span className="account-section-icon"><BriefcaseBusiness size={18} /></span><div><h2>Compare your experience</h2><p>Use the same resume text you would submit to an employer.</p></div></div>
          <label className="field"><span>Your resume</span><textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} maxLength={20000} rows={13} placeholder="Paste your resume text..." required /></label>
          <label className="field"><span>Job description</span><textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={12000} rows={11} placeholder="Paste the complete job description..." required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary" type="submit" disabled={loading || !resumeText.trim() || !jobDescription.trim()}>{loading ? <LoaderCircle className="spin" size={15} /> : <ScanSearch size={15} />} {loading ? 'Comparing your resume…' : 'Find my job match'} <ArrowRight size={15} /></button>
        </form>
        <section className="job-match-results">
          <div className="account-form-heading"><span className="account-section-icon"><Sparkles size={18} /></span><div><h2>Match results</h2><p>Evidence from the resume compared with the role requirements.</p></div></div>
          {loading ? <div className="empty-state"><LoaderCircle className="spin" size={24} /><h2>Reviewing role fit…</h2><p>Comparing your resume with the job requirements.</p></div> : result ? <>
            <div className="job-match-score"><strong>{result.overall_score}<small>/100</small></strong><span>Resume alignment score</span></div>
            <p className="job-match-summary">{result.summary}</p>
            <div className="job-match-columns"><section><h3><CheckCircle2 size={15} /> Evidence found</h3>{result.skills_found.length ? <ul>{result.skills_found.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No clearly evidenced skills were identified.</p>}</section><section><h3><Target size={15} /> Skills not evidenced</h3>{result.missing_job_skills.length ? <ul>{result.missing_job_skills.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No missing skills were identified from the supplied text.</p>}</section></div>
            <section className="job-match-recommendations"><h3>Recommended next steps</h3><ul>{result.recommendations.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
            <p className="job-match-history-note">This comparison is also saved in your <a href="/analysis-history">analysis history</a>.</p>
          </> : <div className="empty-state"><span className="empty-icon"><Target size={22} /></span><h2>Find your strongest fit</h2><p>Submit both fields to see matching evidence, missing requirements, and practical improvements.</p></div>}
        </section>
      </div>
    </main>
  )
}
