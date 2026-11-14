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
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { analyzerApi } from '../api/analyzer'
import { getApiError } from '../utils/apiErrors'

const MAX_RESUME_LENGTH = 20000
const MAX_JOB_LENGTH = 12000
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['pdf', 'docx']

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
  if (data?.resume_file) return data.resume_file.join(' ')
  if (data?.non_field_errors) return data.non_field_errors.join(' ')
  return getApiError(error)
}

function formatFileSize(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Analyzer() {
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const requestRef = useRef(null)
  const isSubmittingRef = useRef(false)
  const resumeTooLong = resumeText.length > MAX_RESUME_LENGTH
  const jobTooLong = jobDescription.length > MAX_JOB_LENGTH
  const hasResume = Boolean(resumeText.trim() || resumeFile)
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

  function clearResult() {
    setResult(null)
    setError('')
  }

  function updateResumeText(value) {
    cancelAnalysis()
    setResumeText(value)
    if (value.trim()) {
      setResumeFile(null)
      setFileInputKey((key) => key + 1)
    }
    clearResult()
  }

  function updateJobDescription(value) {
    cancelAnalysis()
    setJobDescription(value)
    clearResult()
  }

  function selectResumeFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError('Choose a PDF or DOCX resume file.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('The resume file must be 5 MB or smaller.')
      event.target.value = ''
      return
    }
    if (file.size === 0) {
      setError('The selected file is empty. Choose another file.')
      event.target.value = ''
      return
    }
    cancelAnalysis()
    setResumeFile(file)
    setResumeText('')
    clearResult()
  }

  function removeResumeFile() {
    setResumeFile(null)
    setFileInputKey((key) => key + 1)
    clearResult()
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
        resume_file: resumeFile,
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
        <span>Your resume is processed temporarily for analysis. Contact details are redacted before text is sent to Groq. We save only the generated feedback in your private analysis history—not your uploaded file, resume text, or job description.</span>
      </div>

      <div className="analyzer-layout">
        <form className="analyzer-form" onSubmit={handleSubmit}>
          <div className="analyzer-card-heading">
            <span className="analyzer-card-icon"><FileText size={17} /></span>
            <span>
              <strong>Prepare your analysis</strong>
              <small>Upload a PDF/DOCX file or paste resume text.</small>
            </span>
          </div>

          <div className="analyzer-upload">
            <label className="field" htmlFor="analyzer-resume-file">
              <span>Upload resume <small>(PDF or DOCX, max 5 MB)</small></span>
              <input
                key={fileInputKey}
                id="analyzer-resume-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={selectResumeFile}
                disabled={isLoading}
              />
            </label>
            {resumeFile && (
              <div className="analyzer-selected-file">
                <FileText size={17} />
                <span><strong>{resumeFile.name}</strong><small>{formatFileSize(resumeFile.size)}</small></span>
                <button type="button" onClick={removeResumeFile} aria-label="Remove selected resume" disabled={isLoading}><X size={16} /></button>
              </div>
            )}
            <div className="analyzer-input-divider"><span>OR PASTE RESUME TEXT</span></div>
          </div>

          <label className="field analyzer-field" htmlFor="analyzer-resume">
            <span>Resume text <em>Required if no file is uploaded</em></span>
            <textarea
              id="analyzer-resume"
              value={resumeText}
              onChange={(event) => updateResumeText(event.target.value)}
              maxLength={MAX_RESUME_LENGTH + 1}
              rows={12}
              placeholder="Paste the text from your resume here..."
              aria-describedby="resume-text-help"
              disabled={Boolean(resumeFile) || isLoading}
              required={!resumeFile}
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
              disabled={isLoading}
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
                ? 'Upload a resume or paste its text to start the analysis.'
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
          <p className="analyzer-submit-note">Files are limited to 5 MB and 10 PDF pages. Scanned/image-only PDFs are not supported yet. <Link to="/analysis-history">View saved analyses</Link>.</p>
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
              <p>Your submitted resume is being extracted and analyzed. This may take up to a minute.</p>
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
              <p>Upload your resume or paste its text to receive an evidence-based review. Add a job description for a targeted comparison.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
