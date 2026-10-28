# Resume Analyzer API

The analyzer accepts plain resume text and an optional job description. It sends
those values to Groq's `openai/gpt-oss-120b` model and validates the JSON result
before returning it. The model ID was confirmed against the active Groq models
endpoint during implementation. The Groq API key stays on the Django server.

## Configuration

Set `GROQ_API_KEY` in `analyzer/.env`. Django loads that file from
`BASE_DIR / "analyzer" / ".env"`. Optional `GROQ_MODEL` selects the Groq model;
the default is `openai/gpt-oss-120b`. Do not commit this file or put provider
credentials in the frontend.

For deployment, set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, and
`DJANGO_ALLOWED_HOSTS` to a comma-separated list of trusted hostnames. The
local-only development secret is used only while debug mode is enabled.

Install backend dependencies from `requirements.txt`, then run the existing
server as usual. This feature does not add or alter database models; analysis
input and output are not persisted.

## Endpoint

`POST /api/analyzer/analyze/` requires the same authentication as other API
routes. Send:

```json
{
  "resume_text": "Example Candidate\nSoftware Developer\nBuilt reporting tools with Python.",
  "job_description": "Seeking a software developer with Python experience."
}
```

`job_description` may be omitted. Resume text is limited to 20,000 characters
and the job description to 12,000 characters. The endpoint evaluates only the
text the authenticated caller submits; it does not load another user's saved
resume. Inputs and results are not stored by this endpoint. They are sent to the
Groq API for processing, so do not submit sensitive information unless your
deployment's privacy terms permit it.
The Django request-body limit is 256 KiB, and requests above the per-field
character limits are rejected.

The API returns `overall_score` (0-100), `summary`, `strengths`, `improvements`,
`skills_found`, `missing_job_skills`, `experience_feedback`,
`formatting_feedback`, and `recommendations`. Missing job-description skills
mean that the resume text does not clearly evidence those skills; they do not
mean the candidate lacks them.

Authentication is required, with a limit of 10 analyzer requests per user per
hour. Contact email addresses and phone numbers are redacted before provider
submission. Production deployments still need HTTPS, provider usage/privacy
review, and standard Django production settings. Groq-dependent tests mock the
provider and do not require a real API key or make billable calls.
