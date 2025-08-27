# Talent Match AI

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#) [![Tests](https://img.shields.io/badge/tests-in_progress-yellow)](#) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

AI-assisted candidate screening platform. The system extracts skills from resumes and job descriptions using Azure AI, creates weighted assessment criteria (barem), and recommends candidates. It includes a Next.js dashboard and a FastAPI backend with SQLite storage.


## Features

- __Resume/Job Skill Extraction__: Extracts categorized technical skills from PDFs or raw text via Azure AI (`crewai.llm.LLM`).
- __Multi-candidate Matching__: Computes skill match percentage with synonym handling and thresholding.
- __Barem Builder__: Creates and persists job-specific assessment criteria.
- __Candidate Reports DB__: Stores structured AI reports and recommendations in SQLite.
- __Modern Dashboard__: Next.js 15 app with Shadcn/Radix UI components, candidates overview, job detail, PDF viewer, and AI report modals.
- __Asset-backed CVs__: CV files organized under `frontend/assets/jobs/<job>/<file>` and served via app routes.


## Architecture Overview

- __Frontend (Next.js 15)__
  - App Router in `frontend/app/`
  - UI components in `frontend/components/` (Shadcn/Radix)
  - Data hooks in `frontend/hooks/` consuming the backend and local assets
  - API route helpers (e.g., `app/api/materialize-recommended/route.ts`) for file ops on assets

- __Backend (FastAPI)__
  - Main service in `backend/src/resume/main.py`
  - Skill extraction in `backend/src/resume/skill_extraction.py` using Azure AI via CrewAI LLM
  - Candidate report schema in `backend/src/resume/report_schema.py`
  - SQLite models/session in `backend/src/resume/database.py`
  - Additional Crew-based processing in `backend/src/resume/crew.py`

- __Data Storage__
  - SQLite file at project root: `candidate_reports.db`
  - CV assets in `frontend/assets/jobs/`

- __Integration Flow__
  1. Upload CV or paste job description to extract skills.
  2. Create/adjust barem (weights per category).
  3. Run multi-candidate matching to mark recommended candidates.
  4. Frontend consumes lists, renders dashboards, and can materialize recommended CVs into dedicated folders.

```mermaid
flowchart LR
  subgraph Frontend (Next.js)
    UI[Dashboard & Pages]
    HOOKS[use-backend-api]
    API[app/api routes]
  end

  subgraph Backend (FastAPI)
    SKILL[extract_skills_from_cv]
    MATCH[analyze_skill_match_multi]
    BAREM[/barem & job-* endpoints/]
    DB[(SQLite candidate_reports.db)]
  end

  UI --> HOOKS -->|HTTP JSON| SKILL
  HOOKS -->|HTTP JSON| MATCH
  HOOKS -->|HTTP JSON| BAREM
  BAREM <--> DB
  MATCH <--> DB
  SKILL <--> DB
  API -->|file ops| Assets[(frontend/assets/jobs)]
```


## Tech Stack

- __Frontend__: Next.js 15, React 19, Radix UI, Shadcn components, Tailwind CSS v4, SWR, react-pdf
- __Backend__: FastAPI, Uvicorn, SQLAlchemy, SQLite
- __AI__: CrewAI LLM wrapper configured for Azure AI (model, endpoint, api_version)
- __PDF__: PyMuPDF/PyPDF2, Custom PDF tool
- __Utilities__: python-dotenv, rapidfuzz (similarity), python-multipart

See `backend/pyproject.toml` and `backend/requirements.txt`, and `frontend/package.json`.


## Project Structure

```
finale/
├─ backend/
│  ├─ src/resume/
│  │  ├─ main.py                # FastAPI endpoints
│  │  ├─ skill_extraction.py    # Azure AI skill extraction
│  │  ├─ report_schema.py       # Pydantic report schema
│  │  ├─ database.py            # SQLAlchemy + SQLite
│  │  ├─ crew.py                # CrewAI agents & tasks
│  │  └─ tools/                 # Custom tools (e.g., PDF)
│  ├─ requirements.txt
│  └─ pyproject.toml
├─ frontend/
│  ├─ app/                      # Next.js app router & API routes
│  ├─ components/               # UI components (Radix/Shadcn)
│  ├─ hooks/                    # Data hooks to backend/assets
│  ├─ assets/jobs/              # CVs organized by job
│  └─ package.json
└─ candidate_reports.db         # SQLite database (generated)
```


## Prerequisites

- Node.js 20+ and npm
- Python 3.10–3.12
- Azure AI Inference credentials
  - AZURE_AI_API_KEY
  - AZURE_AI_ENDPOINT
  - AZURE_AI_API_VERSION
  - model (deployment name)


## Local Installation

- __Backend__
  1. Create and activate a virtualenv (recommended).
  2. Copy `backend/.env.example` to `backend/.env` (or create `.env`) and set:
     - `AZURE_AI_API_KEY=...`
     - `AZURE_AI_ENDPOINT=...` (e.g., https://<resource>.openai.azure.com)
     - `AZURE_AI_API_VERSION=...` (e.g., 2024-02-15-preview)
     - `model=...` (deployment name)
  3. Install deps:
     ```bash
     pip install -r backend/requirements.txt
     ```
  4. Start API:
     ```bash
     uvicorn resume.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend/src
     ```

- __Frontend__
  1. Install deps:
     ```bash
     cd frontend
     npm install
     ```
  2. Start dev server:
     ```bash
     npm run dev
     ```
  3. The dashboard runs on http://localhost:3000

If your backend runs on a different port/host, configure the frontend API base URL in your data layer (`frontend/lib/api-service` if present) or environment.


## Usage

- Open http://localhost:3000
- Explore jobs and candidates in the dashboard.
- Backend endpoints listen on http://localhost:8000
- Use the provided API routes to:
  - Upload CVs or submit job descriptions for skill extraction
  - Generate/Update a barem for a job
  - Analyze multiple candidates for recommendations
  - Query stored reports/candidates


## API Documentation (selected)

Base URL: `http://localhost:8000`

- __POST__ `/extract-skills-from-cv`
  - Form-data inputs: either `file: PDF` or `job_description: string` + `job_title: string`
  - Response: categorized skills JSON or `{ "already_extracted": true }`

- __GET__ `/display_skills`
  - Returns all extracted candidate skills from SQLite.

- __GET__ `/job-skills/{job_title}`
  - Returns previously extracted required skills for a job.

- __GET__ `/job-barem/{job_title}`
  - Returns assessment criteria (barem) for a job.

- __POST__ `/barem`
  - Body:
    ```json
    {
      "job_title": "Data Analyst",
      "skills_weights": {"Business Intelligence": 20, "Programming Languages": 20},
      "categorized_skills": {"Business Intelligence": ["Power BI"], "Programming Languages": ["SQL"]}
    }
    ```
  - Persists/updates `barem_json` for the job.

- __POST__ `/analyze-skill-match-multi`
  - Body:
    ```json
    {
      "job_title": "Data Analyst",
      "candidates": [{"name": "Jane Doe", "skills": {"Programming Languages": ["SQL", "Python"]}}],
      "job_skills": {"Programming Languages": ["SQL", "Python"], "Business Intelligence": ["Power BI"]},
      "threshold": 50
    }
    ```
  - Response: `{ "matched_candidates": ["Jane Doe"], "errors": null }`

- __GET__ `/candidates`
  - Returns candidate names with report counts and latest report date.

- __GET__ `/candidate/{candidate_name}/reports`
  - Returns all saved reports for a candidate.

- __GET__ `/candidate/{candidate_name}/latest`
  - Returns latest report for a candidate.

Note: Additional endpoints exist under `backend/src/resume/main.py`.


## Database Schema (SQLite)

- __Table: candidate_reports__ (SQLAlchemy in `database.py`)
  - Fields: `applied_job_title`, `applied_job_description`, `candidate_name`, `candidate_job_title`,
    `candidate_experience`, `candidate_background`, `requirements_analysis (JSON)`, `match_results (JSON)`,
    `scoring_weights (JSON)`, `score_details (JSON)`, `total_weighted_score (Float)`, `strengths (JSON)`,
    `gaps (JSON)`, `rationale (Text)`, `risk (Text)`, `next_steps (JSON)`, `is_recommended (Boolean)`, `created_at`

- __Table: extracted_skills__ (created ad-hoc in `main.py`)
  - Fields: `candidate_name`, `cv_filename`, `skills_json`

- __Table: job_required_skills__ (created ad-hoc in `main.py`)
  - Fields: `job_title`, `required_skills_json`, `barem_json`, `analyzed_candidates?`, `recommended_candidates?`

The database file `candidate_reports.db` is created at the project root.


## Testing

- Backend: add pytest-based tests under `backend/tests/` (suggested). Example invocations:
  ```bash
  pytest -q
  ```
- Frontend: run `npm run test` after adding tests with Jest/RTL (suggested).


## Deployment

- __Docker (suggested)__
  - Build separate images for frontend and backend. Expose 3000 (FE) and 8000 (BE). Use a reverse proxy (nginx/Caddy).
- __Vercel + Render/Fly.io__
  - Frontend on Vercel. Backend on a Python host (Render/Fly/Azure App Service). Provide env vars for Azure AI and persist `candidate_reports.db` to a mounted volume.
- __Azure__
  - Backend as Azure App Service with managed identity/secrets. Frontend as Static Web Apps or Vercel. Use Azure Files for SQLite or migrate to a hosted DB.


## Contributing

1. Fork the repo and create a feature branch.
2. Run both apps locally and add/adjust tests.
3. Submit a PR with a clear description and screenshots for UI changes.

Use conventional commits and keep changes scoped.


## License

MIT License. See `LICENSE`.


## Screenshots / Demo

- Dashboard Home
- Job Detail with Recommended Candidates
- AI Report Modal

Add images under `frontend/public/` and reference them here, or link to a live demo if available.


## Acknowledgments

- CrewAI and the open-source community
- Radix UI/Shadcn
- Azure AI Inference
