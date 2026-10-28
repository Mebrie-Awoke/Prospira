import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Analyzer from './Analyzer'
import { analyzerApi } from '../api/analyzer'

vi.mock('../api/analyzer', () => ({
  analyzerApi: { analyze: vi.fn() },
}))

const analysis = {
  overall_score: 78,
  summary: 'Relevant experience is supported by measurable outcomes.',
  strengths: ['Includes measurable project outcomes.'],
  improvements: ['Clarify the scope of team leadership.'],
  skills_found: ['Python'],
  missing_job_skills: [],
  experience_feedback: 'Experience entries explain outcomes clearly.',
  formatting_feedback: 'The extracted text has clear section headings.',
  recommendations: ['Add evidence for role-specific skills.'],
}

function enterResume(value = 'Resume text with Python experience') {
  fireEvent.change(screen.getByLabelText(/Resume text/), {
    target: { value },
  })
}

describe('Analyzer', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders the input form and disables submission until resume text is provided', () => {
    render(<Analyzer />)

    expect(screen.getByRole('heading', { name: 'Resume Analyzer' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Analyze resume/ }).disabled).toBe(true)
    expect(screen.getByText('Add your resume text to start the analysis.')).toBeTruthy()
  })

  it('rejects resume text above the character limit', () => {
    render(<Analyzer />)
    enterResume('x'.repeat(20_001))

    expect(screen.getByRole('button', { name: /Analyze resume/ }).disabled).toBe(true)
    expect(screen.getByText('Reduce the text to the displayed character limits before analysis.')).toBeTruthy()
  })

  it('submits through analyzerApi and renders results and empty categories', async () => {
    analyzerApi.analyze.mockResolvedValue(analysis)
    render(<Analyzer />)
    enterResume()
    fireEvent.change(screen.getByLabelText(/Target job description/), {
      target: { value: 'Seeking a Python engineer' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Analyze resume/ }))

    expect(await screen.findByText(analysis.summary)).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Overall score: 78 out of 100' })).toBeTruthy()
    expect(screen.getByText('No specific items to report.')).toBeTruthy()
    expect(analyzerApi.analyze).toHaveBeenCalledWith(expect.objectContaining({
      resume_text: 'Resume text with Python experience',
      job_description: 'Seeking a Python engineer',
      signal: expect.any(AbortSignal),
    }))
  })

  it('shows loading state and ignores duplicate submissions', () => {
    analyzerApi.analyze.mockReturnValue(new Promise(() => {}))
    render(<Analyzer />)
    enterResume()
    const form = screen.getByLabelText(/Resume text/).closest('form')

    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(analyzerApi.analyze).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /Analyzing resume/ }).disabled).toBe(true)
    expect(screen.getByText('Your submitted text is being analyzed. This may take up to a minute.')).toBeTruthy()
  })

  it('shows backend field validation errors', async () => {
    analyzerApi.analyze.mockRejectedValue({
      response: { data: { resume_text: ['Resume text is invalid.'] } },
    })
    render(<Analyzer />)
    enterResume()
    fireEvent.click(screen.getByRole('button', { name: /Analyze resume/ }))

    expect((await screen.findByRole('alert')).textContent).toContain('resume text: Resume text is invalid.')
    expect(screen.getByRole('button', { name: /Retry analysis/ }).disabled).toBe(false)
  })

  it('offers retry after a network error and renders the subsequent result', async () => {
    analyzerApi.analyze
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(analysis)
    render(<Analyzer />)
    enterResume()
    fireEvent.click(screen.getByRole('button', { name: /Analyze resume/ }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Retry analysis/ }))

    expect(await screen.findByText(analysis.summary)).toBeTruthy()
    expect(analyzerApi.analyze).toHaveBeenCalledTimes(2)
  })

  it('cancels the active request and resets loading state', () => {
    analyzerApi.analyze.mockReturnValue(new Promise(() => {}))
    render(<Analyzer />)
    enterResume()
    fireEvent.click(screen.getByRole('button', { name: /Analyze resume/ }))
    const signal = analyzerApi.analyze.mock.calls[0][0].signal

    fireEvent.click(screen.getByRole('button', { name: 'Cancel analysis' }))

    expect(signal.aborted).toBe(true)
    expect(screen.getByRole('button', { name: /Analyze resume/ }).disabled).toBe(false)
    expect(screen.queryByText('Reviewing your resume')).toBeNull()
  })

  it('aborts stale analysis and clears feedback when the input changes', async () => {
    analyzerApi.analyze.mockResolvedValueOnce(analysis).mockReturnValueOnce(new Promise(() => {}))
    render(<Analyzer />)
    enterResume()
    fireEvent.click(screen.getByRole('button', { name: /Analyze resume/ }))
    expect(await screen.findByText(analysis.summary)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Analyze again/ }))
    const signal = analyzerApi.analyze.mock.calls[1][0].signal
    enterResume('A different resume')

    expect(signal.aborted).toBe(true)
    expect(screen.queryByText(analysis.summary)).toBeNull()
    expect(screen.queryByText('Reviewing your resume')).toBeNull()
  })
})