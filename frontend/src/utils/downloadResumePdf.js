import { resumesApi } from '../api/resumes'

export async function downloadResumePdf(id, suggestedName = 'resume') {
  const response = await resumesApi.downloadPdf(id)
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const disposition = response.headers['content-disposition'] || ''
  const serverFilename = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const safeName = String(suggestedName || 'resume')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim()
  const filename = serverFilename || `${safeName || 'resume'}.pdf`
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
