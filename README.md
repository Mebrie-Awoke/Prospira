# Prospira

**Build a stronger resume. Present your potential. Move your career forward.**

Prospira is a full-stack resume platform with a public landing page, authenticated career workspace, professional resume templates, and AI-assisted feedback tailored to a job description.

## Features

- Create, edit, and manage personal resumes.
- Organize education, experience, skills, projects, certifications, and links.
- Choose from eight distinct resume template layouts, including classic, modern, minimalist, executive, technical, academic, creative, and compact.
- Download a template-styled PDF directly from the resume builder or preview.
- Upload a profile photo.
- Analyze resume content with AI and receive actionable feedback.
- Save and revisit private analysis results without retaining source resume text or job descriptions.
- Generate, edit, copy, and manage AI-assisted cover letters.
- Compare resume evidence with a target job description in a dedicated job-match workspace.
- Secure account access with JWT authentication.
- Update account profile details and change passwords.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Python 3.12, Django, Django REST Framework |
| Authentication | Simple JWT |
| AI | Groq API |
| Database | SQLite (development), PostgreSQL (supported) |
| PDF generation | ReportLab |
| Deployment | Docker, Gunicorn, WhiteNoise |

## Project Structure

```text
Prospira/
├── backend/
│   ├── analyzer/       # AI resume analysis
│   ├── config/         # Django configuration
│   ├── resumes/        # Resume APIs and models
│   └── manage.py
├── frontend/           # React application
├── .env.example
├── Dockerfile
└── README.md
```

## Frontend deployment configuration

The React application is deployed independently from the Django API. Set `VITE_API_BASE_URL` to the complete API base URL, including `/api`, in the frontend hosting environment. For Vercel, use the URL of your deployed Render API, for example `https://your-api.onrender.com/api`. The `frontend/vercel.json` file provides a single-page-app route fallback for React Router.

For local development, copy `frontend/.env.example` to `frontend/.env` and keep the local Django API URL.

## Run Locally

### Requirements

- Python 3.12
- Node.js 20+
- npm
- Groq API key (for AI analysis)

### 1. Clone the project

```bash
git clone https://github.com/Mebrie-Awoke/Prospira.git
cd Prospira
```

### 2. Start the backend

```bash
cd backend
py -3.12 -m venv .venv
```

Activate the environment:

- Windows PowerShell: `.\.venv\Scripts\Activate.ps1`
- macOS/Linux: `source .venv/bin/activate`

Install dependencies and run migrations:

```bash
pip install -r requirements.txt
py manage.py migrate
py manage.py runserver
```

Configure AI analysis in `backend/analyzer/.env`:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

The backend runs at `http://127.0.0.1:8000`.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Run the app:

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/register/` | Create an account |
| POST | `/api/token/` | Obtain JWT tokens |
| POST | `/api/token/refresh/` | Refresh an access token |
| GET, POST | `/api/resumes/` | List or create resumes |
| GET, PUT, PATCH, DELETE | `/api/resumes/{id}/` | Manage a resume |
| GET | `/api/resumes/{id}/pdf/` | Download a professionally formatted PDF
| POST, DELETE | `/api/resumes/{id}/photo/` | Add or remove a profile photo |
| POST | `/api/analyzer/analyze/` | Analyze resume text and save the result to private history |
| GET | `/api/analyzer/history/` | List the signed-in user's saved analyses |
| GET, DELETE | `/api/analyzer/history/{id}/` | View or delete a saved analysis |
| POST | `/api/analyzer/cover-letters/generate/` | Generate and save a tailored cover letter |
| GET | `/api/analyzer/cover-letters/` | List the signed-in user's saved cover letters |
| GET, PATCH, DELETE | `/api/analyzer/cover-letters/{id}/` | View, edit, or delete a saved cover letter |
| GET, PATCH | `/api/account/profile/` | Read or update the signed-in user's profile |
| POST | `/api/account/password/` | Change the signed-in user's password |

The analyzer accepts `resume_text` and an optional `job_description`. It returns a score, strengths, improvement suggestions, skills analysis, and recommendations. Successful feedback is saved to the authenticated user's private history; source resume text, uploaded files, and job descriptions are not stored. Cover letter generation requires resume text and a target job description and stores only the generated letter. Analyzer and cover-letter generation are authenticated and share a rate limit of 10 AI requests per user per hour.

## Docker

Build and run from the repository root:

```bash
docker build -t prospira .
docker run --env-file .env -p 8000:8000 prospira
```

Configure production values for `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, and `GROQ_API_KEY`. Use HTTPS, secure secret storage, database backups, and persistent storage for uploaded media in production.

## Security & Privacy

- Keep API keys and Django secrets on the server; never commit real credentials.
- Resume endpoints restrict access to the authenticated owner.
- Submitted resume text is sent to Groq for AI analysis. Email addresses and phone numbers are redacted before submission.

## License

No license has been specified yet.
