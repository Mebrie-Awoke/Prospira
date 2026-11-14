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
- Manage Free and Premium subscriptions with Chapa checkout and server-side payment verification.
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
| Payments | Chapa (ETB checkout and server-side verification) |
| Deployment | Docker, Gunicorn, WhiteNoise |

## Project Structure

```text
Prospira/
├── backend/
│   ├── analyzer/       # AI resume analysis and cover letters
│   ├── billing/        # Subscription plans and Chapa payments
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
| GET | `/api/resumes/{id}/pdf/` | Download a professionally formatted PDF |
| POST, DELETE | `/api/resumes/{id}/photo/` | Add or remove a profile photo |
| POST | `/api/analyzer/analyze/` | Analyze resume text and save the result to private history |
| GET | `/api/analyzer/history/` | List the signed-in user's saved analyses |
| GET, DELETE | `/api/analyzer/history/{id}/` | View or delete a saved analysis |
| POST | `/api/analyzer/cover-letters/generate/` | Generate and save a tailored cover letter |
| GET | `/api/analyzer/cover-letters/` | List the signed-in user's saved cover letters |
| GET, PATCH, DELETE | `/api/analyzer/cover-letters/{id}/` | View, edit, or delete a saved cover letter |
| GET, PATCH | `/api/account/profile/` | Read or update the signed-in user's profile |
| POST | `/api/account/password/` | Change the signed-in user's password |
| GET | `/api/billing/subscription/` | Read the signed-in user's subscription and checkout availability |
| POST | `/api/billing/checkout/` | Initialize a Premium checkout with Chapa |
| GET | `/api/billing/chapa/callback/` | Verify a Chapa payment before granting Premium access |

Billing uses one-time 30-day Premium purchases in ETB; automatic recurring billing is not enabled. The backend verifies every Chapa transaction server-to-server and checks the transaction reference, amount, currency, and payment status before activating Premium. Free accounts receive 10 AI requests per hour; active Premium accounts receive 100 per hour. Set `CHAPA_SECRET_KEY`, `CHAPA_PREMIUM_AMOUNT_ETB`, `SITE_URL`, and `FRONTEND_URL` before enabling checkout. The `299.00` ETB value in `.env.example` is only a sample price—choose and configure the actual price for your product.

The analyzer accepts `resume_text` and an optional `job_description`. It returns a score, strengths, improvement suggestions, skills analysis, and recommendations. Successful feedback is saved to the authenticated user's private history; source resume text, uploaded files, and job descriptions are not stored. Cover letter generation requires resume text and a target job description and stores only the generated letter. Analyzer and cover-letter generation are authenticated and share a combined rate limit of 10 AI requests per hour on Free or 100 per hour on active Premium.


## Production deployment

### Render backend and PostgreSQL

The repository includes a `render.yaml` Blueprint for a Docker web service, managed PostgreSQL, and a persistent media disk.

1. Push the repository to GitHub and open the Render Dashboard.
2. Choose **New → Blueprint**, connect this repository, and let Render read `render.yaml`.
3. Review the paid web-service, database, and disk plans shown by Render before confirming. The Blueprint uses Frankfurt for the web service and database.
4. When prompted, set `CORS_ALLOWED_ORIGINS` to the exact HTTPS origin of the deployed Vercel frontend (for example, `https://your-project.vercel.app`). Do not include a trailing slash.
5. Set `GROQ_API_KEY` using the secret from your Groq account. Keep it in Render's environment settings only.
6. Wait for the first deployment and check `https://YOUR-RENDER-SERVICE.onrender.com/api/health/`.

The container runs database migrations before starting Gunicorn. The persistent disk is mounted at `backend/media` so profile photos survive deployments. Keep database backups enabled and do not remove the disk without migrating uploaded files first.

### Vercel frontend

1. Import this repository into Vercel.
2. Set the project **Root Directory** to `frontend`.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Add `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api` to the Vercel production environment.
5. Redeploy after setting the environment variable.
6. Copy the final Vercel origin into Render's `CORS_ALLOWED_ORIGINS` setting and redeploy the backend if it changes.
7. Set `CHAPA_SECRET_KEY` from your Chapa merchant account, `CHAPA_PREMIUM_AMOUNT_ETB` to the price you choose in ETB, `SITE_URL` to the public Render API URL, and `FRONTEND_URL` to the public Vercel URL. Configure Chapa to use the callback URL shown in the checkout integration if required by your merchant settings. Test in Chapa sandbox mode before switching to live keys.

Use HTTPS for both services. Configure a custom domain only after the default deployment passes health checks and the login, resume upload, PDF export, AI analysis, history, and cover-letter flows have been tested end to end.

## Docker

Build and run from the repository root:

```bash
docker build -t prospira .
docker run --env-file .env -p 8000:8000 prospira
```

Configure production values for `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, and `GROQ_API_KEY`. Use HTTPS, secure secret storage, database backups, and persistent storage for uploaded media in production.

## Security & Privacy

- Keep API keys and Django secrets on the server; never commit real credentials.
- Resume and billing APIs restrict account data to the authenticated owner.
- Profile photo previews use short-lived signed URLs; raw media paths are not exposed by the API.
- Submitted resume text is sent to Groq for AI analysis. Email addresses and phone numbers are redacted before submission.

## License

No license has been specified yet.
