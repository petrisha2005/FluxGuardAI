# FluxGuard AI

**Predict. Prevent. Protect.**

FluxGuard AI is a predictive crowd orchestration platform for mega-events. It forecasts stadium congestion before it becomes operationally unsafe and prepares role-specific guidance for fans, volunteers, stadium operators, and event organizers.

This repository contains the FluxGuard AI demo and production foundation. The current implementation includes the React command-center experience, local simulation/intelligence layers, FastAPI backend endpoints, and test coverage used for hackathon evaluation.

## Architecture Overview

The implementation follows the architecture defined in [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md):

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Framer Motion, Recharts.
- Backend: Python 3.12 and FastAPI.
- AI boundary: prompt orchestration will live behind backend services, never directly in route handlers.
- ML boundary: forecast services will emit predictions only; deterministic risk scoring and alerting remain separate.
- Realtime boundary: WebSockets carry event-scoped operational updates; local simulation remains deterministic for demo/test repeatability.
- Performance boundary: route-level code splitting keeps command-center, analytics, AI, and admin screens outside the initial public-page bundle.

## Repository Structure

```text
frontend/       React application foundation
backend/        FastAPI application foundation
docs/           Product and architecture documentation
prompts/        Version-controlled prompt templates
.github/        CI workflows
```

## Prerequisites

- Node.js 20 or newer.
- Python 3.12.
- npm.

## Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`

## Backend Setup

```bash
cd backend
cp .env.example .env
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Health endpoint:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "FluxGuard AI API"
}
```

## Development Commands

Frontend:

```bash
npm run lint
npm run format
npm run test
npm run build
```

Backend:

```bash
cd backend
.venv/bin/python -m ruff check app
.venv/bin/python -m black --check app
.venv/bin/python -m pytest
```

Run all pre-commit hooks:

```bash
pre-commit run --all-files
```

## Security Baseline

- No secrets are committed.
- `.env.example` files document required variables.
- Backend CORS defaults to local development origins only.
- API errors avoid leaking internal exception details.
- AI provider calls must go through service adapters in future implementation.

See [SECURITY.md](SECURITY.md) and [docs/SECURITY.md](docs/SECURITY.md).
