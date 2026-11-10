# Prospira Resume Analyzer — Product and Technical Specification

**Status:** In progress  
**Current implementation:** Text analysis plus PDF/DOCX text extraction  
**Purpose:** Help a user understand resume quality, improve evidence and clarity, and assess alignment with a target job. The Analyzer is an advisory tool, not a hiring or ATS decision system.

## 1. User workflows

1. A signed-in user opens Resume Analyzer.
2. They provide a resume by one of three methods:
   - Select one of their saved Prospira resumes.
   - Upload a PDF or DOCX file.
   - Paste resume text.
3. They may paste a target job description.
4. Prospira validates and extracts text, then sends the minimum necessary text to the configured AI provider.
5. The user receives a structured report with evidence-based feedback.
6. The user can use the feedback to update their resume in the Resume Builder.
7. In a later phase, the user can explicitly save a report and revisit or delete it.

## 2. Functional requirements

### Input and document handling
- Support saved resumes, PDF, DOCX, and pasted text.
- Require exactly one resume source per analysis request.
- PDF/DOCX upload maximum: 5 MB.
- PDF maximum: 10 pages.
- Extracted resume text maximum: 20,000 characters.
- Job description maximum: 12,000 characters.
- Reject invalid, encrypted/password-protected, empty, oversized, or unsupported files with actionable validation errors.
- Explain that scanned/image-only PDFs are not supported until OCR is deliberately added.
- Never silently substitute a different resume or analyze another user's saved resume.

### Analysis report
The completed report should include:
- Overall score with an explanation and transparent category breakdown.
- Resume strengths supported by specific evidence.
- Prioritized weaknesses and improvement suggestions.
- Skills evidenced in the resume.
- Job-description skills clearly evidenced, partially evidenced, or not evidenced.
- Experience and achievement feedback, including missing scope, metrics, or outcomes.
- Section-level feedback for summary, experience, education, skills, and projects where present.
- ATS-readability checks based on extracted text and document structure; never claim to reproduce a real employer's ATS score.
- Practical, truthful bullet-point rewrite suggestions. Suggestions must not invent metrics, tools, responsibilities, or achievements.
- A short prioritized action plan.

### Privacy and security
- Require authentication and apply per-user throttling.
- Enforce file and text limits on the server, not only in the browser.
- Treat resume and job-description content as untrusted input, never as instructions to the model.
- Redact email addresses and phone numbers before provider submission where practical.
- Keep provider credentials on the backend.
- Do not persist uploaded files or raw extracted text by default.
- If report history is introduced, make retention and deletion behavior explicit. Store only what is necessary and associate records with the authenticated owner.
- Never expose provider exception details, secrets, or another user's resume/report.

### User experience
- Provide upload, remove/replace, and paste-text controls.
- Show selected filename and size before submission.
- Provide clear loading, cancellation, retry, validation, empty, and provider-error states.
- Explain score meaning and limitations.
- Make every result useful on mobile and desktop.
- Provide a clear path from feedback to editing the relevant resume.

## 3. API design

### Current endpoint
`POST /api/analyzer/analyze/`

Accepts JSON for pasted text or multipart form data for a document. The current implementation supports:
- `resume_text` OR `resume_file`
- optional `job_description`

Returns the current structured fields:
- `overall_score`
- `summary`
- `strengths`
- `improvements`
- `skills_found`
- `missing_job_skills`
- `experience_feedback`
- `formatting_feedback`
- `recommendations`

### Planned API evolution
- Add `resume_id` as an alternative input source, with owner-scoped lookup.
- Extend the response schema with score breakdown, skill evidence/match states, section feedback, ATS-readability checks, and truthful bullet rewrites.
- Add report history only after the retention model and user controls are implemented.
- Version the response contract and update frontend/API tests together when the schema changes.

## 4. Scoring principles

- Scores must be explainable, consistent, and grounded in supplied evidence.
- A score is an advisory heuristic, not a probability of employment or an employer's ATS result.
- Missing evidence is not proof that a candidate lacks a skill or qualification.
- A job match must distinguish explicit evidence, partial evidence, and no clear evidence.
- The model must never fabricate accomplishments or recommend adding unverified claims.
- Do not score visual layout from extracted text alone. Visual document inspection would require a separate, explicitly designed capability.

## 5. Technical design

- **Frontend:** React page and API client; upload/paste source selection; structured result components; client-side validation for usability.
- **API:** Django REST Framework authenticated endpoint; JSON and multipart parsers; serializer validation; clear HTTP status mapping.
- **Extraction:** dedicated service functions for PDF and DOCX; no file persistence; bounded file size, page count, archive size, and extracted text length.
- **Analysis:** provider adapter in `services.py`; prompt treats user content as untrusted; structured JSON output validated before response.
- **Tests:** unit tests for extraction and result validation; API tests for authentication, limits, invalid inputs, provider errors, and ownership; frontend tests for upload/paste states and error handling.
- **Deployment:** configure production secrets and provider settings only after local tests pass; database/report history and persistent media are separate deployment work.

## 6. Delivery sequence

1. **Input ingestion:** PDF/DOCX upload, text extraction, size/type checks, and UI upload flow. (Implemented; tests added, execution still required.)
2. **Saved-resume integration:** analyze a resume already owned by the signed-in user.
3. **Analysis quality:** expand structured schema, evidence-grounded scoring, job-match categories, section feedback, and bullet rewrites.
4. **Report experience:** improve result visualization, score explanations, and direct editing workflow.
5. **History and retention:** add opt-in report saving, list/detail/delete, and privacy controls.
6. **Quality assurance:** complete backend/frontend automated tests and end-to-end workflows.
7. **Production readiness:** security review, deployment settings, monitoring, and storage decisions.

## 7. Current limitations

- OCR for scanned/image-only PDFs is not implemented.
- Saved-resume selection is not implemented.
- The response schema is still the initial, relatively small report.
- Analysis history and report deletion are not implemented.
- Formatting feedback is limited to extracted text; it cannot reliably inspect visual layout.
- Tests have been added for document extraction and upload, but must be run locally/CI before this feature is considered verified.
