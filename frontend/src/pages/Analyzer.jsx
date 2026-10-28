import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { analyzerApi } from '../api/analyzer'
import { getApiError } from '../utils/apiErrors'

const MAX_RESUME_LENGTH = 20000
const MAX_JOB_LENGTH = 12000

const resultSections = [
  ['Strengths', 'strengths'],
  ['Improvement suggestions', 'improvements'],
  ['Skills found', 'skills_found'],
  ['Missing job-description skills', 'missing_job_skills'],
  ['Prioritized recommendations', 'recommendations'],
]

function Score({ value }) {
  return (
    <div
      className="analyzer-score-ring"
      style={{ '--score-progress': `${value}%` }}
      role="img"
      aria-label={`Overall score: ${value} out of 100`}
    >
      <span>{value}</span>
    </div>
  )
}

function ResultList({ title, items }) {
  return (
    <section className="analyzer-result-section">
      <h2>{title}</h2>
      {items.length ? (
        <ul>
          {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      ) : (
        <p>No specific items to report.</p>
      )}
    </section>
  )
}

function getAnalyzerError(error) {
  const data = error.response?.data
  if (data?.detail) return data.detail
  return getApiError(error)
}

export default function Analyzer() {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const requestRef = useRef(null)
  const isSubmittingRef = useRef(false)
  const resumeTooLong = resumeText.length > MAX_RESUME_LENGTH
  const jobTooLong = jobDescription.length > MAX_JOB_LENGTH
  const hasResume = Boolean(resumeText.trim())
  const canAnalyze = hasResume && !resumeTooLong && !jobTooLong && !isLoading

  useEffect(() => () => {
    requestRef.current?.abort()
    requestRef.current = null
  }, [])

  function cancelAnalysis() {
    requestRef.current?.abort()
    requestRef.current = null
    isSubmittingRef.current = false
    setIsLoading(false)
  }

  function updateResumeText(value) {
    cancelAnalysis()
    setResumeText(value)
    setResult(null)
    setError('')
  }

  function updateJobDescription(value) {
    cancelAnalysis()
    setJobDescription(value)
    setResult(null)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canAnalyze || isSubmittingRef.current) return

    const controller = new AbortController()
    requestRef.current = controller
    isSubmittingRef.current = true
    setIsLoading(true)
    setError('')
    setResult(null)
    try {
      const analysis = await analyzerApi.analyze({
        resume_text: resumeText.trim(),
        job_description: jobDescription.trim(),
        signal: controller.signal,
      })
      if (requestRef.current === controller) setResult(analysis)
    } catch (requestError) {
      if (!controller.signal.aborted && requestError.code !== 'ERR_CANCELED') {
        setError(getAnalyzerError(requestError))
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        isSubmittingRef.current = false
        setIsLoading(false)
      }
    }
  }

  return (
    <main className="analyzer-page">
      <header className="analyzer-heading">
        <span className="eyebrow">CAREER DEVELOPMENT</span>
        <h1>Resume Analyzer</h1>
        <p>Get evidence-based feedback on your resume and how it aligns with a target role.</p>
      </header>

      <div className="analyzer-privacy-note">
        <AlertCircle size={17} />
        <span>Your text is sent to Groq for analysis, with email addresses and phone numbers redacted first. Prospira does not save it.</span>
      </div>

      <div className="analyzer-layout">
        <form className="analyzer-form" onSubmit={handleSubmit}>
          <div className="analyzer-card-heading">
            <span className="analyzer-card-icon"><FileText size={17} /></span>
            <span>
              <strong>Prepare your analysis</strong>
              <small>Paste text from a resume. PDF and DOCX uploads are not supported.</small>
            </span>
          </div>
          <label className="field analyzer-field" htmlFor="analyzer-resume">
            <span>Resume text <em>Required</em></span>
            <textarea
              id="analyzer-resume"
              value={resumeText}
              onChange={(event) => updateResumeText(event.target.value)}
              maxLength={MAX_RESUME_LENGTH + 1}
              rows={12}
              placeholder="Paste the text from your resume here..."
              aria-describedby="resume-text-help"
              required
            />
            <small
              id="resume-text-help"
              className={resumeTooLong ? 'analyzer-count analyzer-count-error' : 'analyzer-count'}
            >
              {resumeText.length.toLocaleString()} / {MAX_RESUME_LENGTH.toLocaleString()} characters
            </small>
          </label>

          <label className="field analyzer-field" htmlFor="analyzer-job-description">
            <span>Target job description <small>(Optional)</small></span>
            <textarea
              id="analyzer-job-description"
              value={jobDescription}
              onChange={(event) => updateJobDescription(event.target.value)}
              maxLength={MAX_JOB_LENGTH + 1}
              rows={7}
              placeholder="Paste a job description for role-specific feedback..."
              aria-describedby="job-description-help"
            />
            <small
              id="job-description-help"
              className={jobTooLong ? 'analyzer-count analyzer-count-error' : 'analyzer-count'}
            >
              {jobDescription.length.toLocaleString()} / {MAX_JOB_LENGTH.toLocaleString()} characters
            </small>
          </label>

          {(!hasResume || resumeTooLong || jobTooLong) && (
            <p className="analyzer-validation" role="status">
              {!hasResume
                ? 'Add your resume text to start the analysis.'
                : 'Reduce the text to the displayed character limits before analysis.'}
            </p>
          )}
          {error && (
            <div className="analyzer-error" role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}
          <button className="button button-primary analyzer-submit" type="submit" disabled={!canAnalyze}>
            {isLoading ? <LoaderCircle className="analyzer-spinner" size={16} /> : error ? <RefreshCw size={16} /> : <Sparkles size={16} />}
            {isLoading ? 'Analyzing resume...' : error ? 'Retry analysis' : result ? 'Analyze again' : 'Analyze resume'}
            {!isLoading && <ArrowRight size={15} />}
          </button>
          {isLoading && (
            <button className="analyzer-cancel" type="button" onClick={cancelAnalysis}>
              Cancel analysis
            </button>
          )}
          <p className="analyzer-submit-note">Up to 20,000 resume characters and 12,000 job-description characters. Text is sent to Groq and not stored by Prospira.</p>
        </form>

        <aside className="analyzer-results" aria-label="Analysis results" aria-live="polite">
          <div className="analyzer-card-heading">
            <span className="analyzer-card-icon analyzer-card-icon-score"><BrainCircuit size={17} /></span>
            <span>
              <strong>Analysis results</strong>
              <small>Feedback grounded in the submitted text</small>
            </span>
          </div>

          {isLoading ? (
            <div className="analyzer-empty-state">
              <LoaderCircle className="analyzer-spinner" size={25} />
              <strong>Reviewing your resume</strong>
              <p>Your submitted text is being analyzed. This may take up to a minute.</p>
            </div>
          ) : result ? (
            <>
              <div className="analyzer-score">
                <Score value={result.overall_score} />
                <span><strong>Overall score</strong><small>0-100, based on evidence, relevance, impact, and clarity</small></span>
              </div>
              <section className="analyzer-result-summary">
                <h2>Summary</h2>
                <p>{result.summary}</p>
              </section>
              <div className="analyzer-feedback">
                <section className="analyzer-result-section">
                  <h2>Experience feedback</h2>
                  <p>{result.experience_feedback}</p>
                </section>
                <section className="analyzer-result-section">
                  <h2>Formatting feedback</h2>
                  <p>{result.formatting_feedback}</p>
                </section>
              </div>
              <div className="analyzer-result-list">
                {resultSections.map(([title, key]) => (
                  <ResultList key={key} title={title} items={result[key]} />
                ))}
              </div>
              <p className="analyzer-disclaimer">
                Missing job-description skills are not evidence that you lack those skills; they were not clearly supported by the text provided.
              </p>
            </>
          ) : (
            <div className="analyzer-empty-state">
              <CheckCircle2 size={25} />
              <strong>Your feedback will appear here</strong>
              <p>Submit your resume text to receive an evidence-based review. Add a job description for a targeted comparison.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
