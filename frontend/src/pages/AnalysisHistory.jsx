import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, FileSearch, LoaderCircle, Trash2 } from 'lucide-react'
import { analyzerApi } from '../api/analyzer'
import { getApiError } from '../utils/apiErrors'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function AnalysisHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const data = await analyzerApi.getHistory()
      setItems(Array.isArray(data) ? data : data.results || [])
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [])

  async function removeItem(id) {
    if (!window.confirm('Delete this saved analysis? This cannot be undone.')) return
    setDeleting(id)
    setError('')
    try {
      await analyzerApi.deleteHistory(id)
      setItems((current) => current.filter((item) => item.id !== id))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <main className="analysis-history-page">
      <header className="page-title-row">
        <span className="page-icon"><Clock3 size={20} /></span>
        <div><span className="eyebrow">CAREER DEVELOPMENT</span><h1>Analysis history</h1><p>Revisit feedback from your previous resume reviews.</p></div>
      </header>
      <p className="analysis-history-privacy"><FileSearch size={15} /> Only analysis feedback is saved. Your uploaded resume, extracted text, and job description are not stored.</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      {loading ? (
        <div className="state-panel"><LoaderCircle className="spin" size={20} /> Loading your saved analyses…</div>
      ) : items.length ? (
        <div className="analysis-history-list">
          {items.map((item) => (
            <article className="analysis-history-card" key={item.id}>
              <div className="analysis-history-card-top">
                <div><span className="eyebrow">RESUME REVIEW</span><h2>{item.summary || 'Resume analysis'}</h2><p><CalendarDays size={13} /> {formatDate(item.created_at)}</p></div>
                <div className="analysis-history-score" aria-label={`Score ${item.overall_score} out of 100`}>{item.overall_score}<small>/100</small></div>
              </div>
              <details className="analysis-history-details">
                <summary>View complete feedback</summary>
                <div className="analysis-history-result">
                  <p>{item.result?.summary}</p>
                  {['strengths', 'improvements', 'skills_found', 'missing_job_skills', 'recommendations'].map((key) => (
                    <section key={key}><h3>{key.replaceAll('_', ' ')}</h3>{item.result?.[key]?.length ? <ul>{item.result[key].map((entry, index) => <li key={index}>{entry}</li>)}</ul> : <p>No items recorded.</p>}</section>
                  ))}
                  <section><h3>Experience feedback</h3><p>{item.result?.experience_feedback}</p></section>
                  <section><h3>Formatting feedback</h3><p>{item.result?.formatting_feedback}</p></section>
                </div>
              </details>
              <div className="analysis-history-actions"><button className="button button-outline" type="button" onClick={() => removeItem(item.id)} disabled={deleting === item.id}>{deleting === item.id ? <LoaderCircle className="spin" size={14} /> : <Trash2 size={14} />} Delete analysis</button></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state"><span className="empty-icon"><FileSearch size={22} /></span><h2>No saved analyses yet</h2><p>Complete a resume analysis and it will appear here automatically.</p></div>
      )}
    </main>
  )
}
