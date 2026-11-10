# Prospira

**Build, manage, and improve your resume.**

Prospira is a full-stack resume application with a React interface and a Django REST API. Users can create and manage structured resumes, choose from available templates, add a profile photo, and receive AI-assisted feedback on resume content with an optional job description.

## Features

- **Account access** — user registration and JWT-based authentication.
- **Resume builder** — create, view, edit, and delete personal resumes.
- **Resume templates** — choose from Classic Professional, Modern Blue, Minimalist, and Executive templates.
- **Structured resume content** — organize education, experience, skills, projects, certifications, languages, and links.
- **Profile photos** — upload or remove a resume photo (maximum 5 MB).
- **AI resume analysis** — get a score, strengths, improvement suggestions, skills identified, experience feedback, formatting feedback, and recommendations.
- **Job-description comparison** — optionally provide a job description to identify skills not clearly evidenced in the resume.
- **Responsive web interface** — built with React and Vite.

AI analysis is provided by Groq. It is an aid for reviewing resume content, not a guarantee of hiring outcomes.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite, React Router, Axios, Tailwind CSS, Lucide |
| Backend | Python 3.12, Django 6.1, Django REST Framework |
| Authentication | Django REST Framework Simple JWT |
| AI analysis | Groq API |
| Database | SQLite for local development; PostgreSQL supported through `DATABASE_URL` |
| Deployment | Docker, Gunicorn, WhiteNoise |

## Project structure

```text
Prospira/
├── backend/
│   ├── analyzer/       # Groq-powered resume analysis
│   ├── config/         # Django settings and URL configuration
│   ├── resumes/        # Resume models, serializers, and API
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
├── .env.example
├── Dockerfile
└── README.md
```

## Getting started

### Prerequisites

- Python 3.12
- Node.js 20 or later and npm
- A Groq API key for AI resume analysis

### 1. Clone the repository

```bash
git clone https://github.com/Mebrie-Awoke/Prospira.git
cd Prospira
```

### 2. Configure and run the backend

From the repository root:

```bash
cd backend
py -3.12 -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies and prepare the database:

```bash
pip install -r requirements.txt
py manage.py migrate
py manage.py runserver
```

The API will be available at `http://127.0.0.1:8000`.

For local AI analysis, create `backend/analyzer/.env` and add:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

The application uses SQLite by default when running in debug mode. To use PostgreSQL, configure `DATABASE_URL` in the backend process environment.

### 3. Configure and run the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env` with the local API URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## API overview

All API paths below are relative to the backend origin.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/register/` | Register an account |
| POST | `/api/token/` | Obtain JWT access and refresh tokens |
| POST | `/api/token/refresh/` | Refresh an access token |
| GET, POST | `/api/resumes/` | List the signed-in user's resumes or create one |
| GET, PUT, PATCH, DELETE | `/api/resumes/{id}/` | Retrieve, update, or delete an owned resume |
| POST, DELETE | `/api/resumes/{id}/photo/` | Upload or remove a resume profile photo |
| POST | `/api/analyzer/analyze/` | Analyze resume text (authentication required) |

The analyzer accepts `resume_text` and an optional `job_description`. It returns structured feedback including `overall_score`, `summary`, `strengths`, `improvements`, `skills_found`, `missing_job_skills`, `experience_feedback`, `formatting_feedback`, and `recommendations`. Analyzer requests are limited to 10 per user per hour.

Authenticated resume endpoints are scoped to the signed-in user. The analyzer evaluates the text submitted in the request; it does not automatically read another user's saved resume.

## Testing

Backend tests:

```bash
cd backend
py manage.py test
```

Frontend tests:

```bash
cd frontend
npm test
```

## Docker deployment

The root `Dockerfile` builds the Vite frontend and serves it through the Django application using Gunicorn. Build and run:

```bash
docker build -t prospira .
docker run --env-file .env -p 8000:8000 prospira
```

Configure the production environment before deploying:

- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY` — a strong, unique secret
- `DJANGO_ALLOWED_HOSTS` — comma-separated trusted hostnames
- `DATABASE_URL` — PostgreSQL connection URL
- `GROQ_API_KEY` — Groq API key
- `GROQ_MODEL` — optional model override

Use `.env.example` as a reference for deployment variables. Do not commit real secrets. Production deployments should also configure persistent/private media storage for uploaded profile photos, HTTPS, database backups, and appropriate access controls.

## Security and privacy notes

- Keep provider API keys and Django secrets on the server; never expose them in frontend environment variables.
- Resume endpoints enforce authenticated user ownership.
- Resume analysis sends submitted resume text to Groq for processing. Contact email addresses and phone numbers are redacted before provider submission, but users should avoid submitting information they do not want processed by the provider.
- Configure production security, allowed hosts, CORS, HTTPS, and persistent media storage for your deployment environment.

## License

No license has been specified for this repository yet.
