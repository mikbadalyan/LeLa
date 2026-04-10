# LE_LA

LE_LA is a mobile-first editorial discovery MVP built as a Progressive Web Application with a Next.js frontend and a FastAPI backend.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Zustand, TanStack Query
- Backend: FastAPI, SQLAlchemy, JWT auth
- Database: PostgreSQL
- Storage: S3-compatible ready configuration with local mock structure

## Workspace

```text
frontend/  Next.js PWA
backend/   FastAPI REST API
```

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment

Create these files before running locally:

- `frontend/.env.local`
- `backend/.env`

Suggested values:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# backend/.env
APP_NAME=LE_LA API
API_V1_PREFIX=/api
SECRET_KEY=change-me-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=postgresql+psycopg://lela:lela@localhost:5432/lela
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=lela-media
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_REGION=eu-west-1
```

Demo account after first backend startup:

```bash
email: charles@lela.local
password: lela1234
```

## MVP Coverage

- JWT authentication
- Infinite editorial feed
- Editorial detail pages with graph navigation
- Contribution submission flow
- Postgres-ready SQLAlchemy schema
- PWA manifest, installability, offline fallback, and service worker
