# Resume Analyzer API

The analyzer accepts either pasted resume text or one PDF/DOCX document, plus an optional job description. It extracts document text in memory, redacts email addresses and phone numbers, sends the text to Groq's `openai/gpt-oss-120b` model, and validates the structured result before returning it.

## Configuration

Set `GROQ_API_KEY` in `analyzer/.env`. Django loads that file from `BASE_DIR / "analyzer" / ".env"`. Optional `GROQ_MODEL` selects the Groq model; the default is `openai/gpt-oss-120b`. Never commit provider credentials or put them in the frontend.

For deployment, set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, and `DJANGO_ALLOWED_HOSTS` to trusted hostnames.

Install backend dependencies from `requirements.txt`, then run Django as usual. This feature does not persist uploaded documents, extracted text, or analysis results.

## Endpoint

`POST /api/analyzer/analyze/` requires authentication.

### Paste text (JSON)

```json
{
  "resume_text": "Example Candidate\nSoftware Developer\nBuilt reporting tools with Python.",
  "job_description": "Seeking a software developer with Python experience."
}
```

### Upload a document (multipart/form-data)

- `resume_file`: one PDF or DOCX file, maximum 5 MB
- `job_description`: optional text, maximum 12,000 characters

Exactly one of `resume_text` or `resume_file` must be supplied. PDF files are limited to 10 pages. DOCX paragraphs and table cells are extracted. Password-protected PDFs, invalid documents, and scanned/image-only PDFs are rejected with a clear validation response. OCR is not supported in this version.

Extracted resume text is limited to 20,000 characters. The Django request-body limit is 6 MiB. Documents are processed in memory/temporary upload handling and are not saved as user resume records.

## Result

The API returns:

- `overall_score` (0-100), `summary`
- `strengths`, `improvements`
- `skills_found`, `missing_job_skills`
- `experience_feedback`, `formatting_feedback`
- `recommendations`

The score is an AI-generated assessment, not a hiring probability or guarantee. Missing job-description skills mean the resume text does not clearly evidence them; they do not mean the candidate lacks those skills. Formatting feedback is limited to what extracted text can show, not the visual layout of the original document.

The endpoint is limited to 10 requests per user per hour. Provider-dependent tests mock Groq and do not make billable calls. Production still requires HTTPS, a review of provider data handling, and persistent storage for other features that save uploaded media.
