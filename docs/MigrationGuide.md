# Migration Guide: In-Memory Mock to PostgreSQL

This document outlines the steps to migrate **FluxGuard AI** from the in-memory mock-simulation layer to a production-ready **PostgreSQL** database.

## Prerequisites
Ensure Python 3.12+ and PostgreSQL 15+ are installed and running.

---

## Step 1: Install Database Dependencies
Activate the virtual environment and install the required dependencies (SQLAlchemy, Alembic, and PostgreSQL driver):

```bash
cd fluxguard-ai/backend
.venv/bin/pip install sqlalchemy alembic psycopg2-binary
```

---

## Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and specify the PostgreSQL database connection URL:

```bash
cp .env.example .env
```

Edit `.env` and update the connection string:
```ini
DATABASE_URL=postgresql://postgres:password@localhost:5432/fluxguard_prod
```

If `DATABASE_URL` is omitted, the application will automatically enter **SQLite Fallback Mode**, generating an isolated local SQLite file (`fluxguard_dev.db`) or using an in-memory database to maintain operation.

---

## Step 3: Run Database Migrations
We use **Alembic** to manage database schema updates. Apply all migrations to bootstrap the target PostgreSQL tables:

```bash
.venv/bin/alembic upgrade head
```

### Creating New Migrations
When making model modifications in `app/db/models.py`, generate a new migration version:

```bash
.venv/bin/alembic revision --autogenerate -m "description of changes"
.venv/bin/alembic upgrade head
```

---

## Step 4: Seed Baseline Data
To populate the empty tables with default stadiums (Lucusa Stadium, City Arena, Downtown Fan Zone), scheduled events, cameras, and staffing parameters, execute the seed utility script:

```bash
.venv/bin/python app/core/seed.py
```

This populates the baseline tables required for local development and integration loops.

---

## Step 5: Verify Setup
To check if the database connections and endpoints are working correctly under SQLAlchemy, execute the test suite:

```bash
.venv/bin/pytest
```

All 89 tests must pass, confirming that the repositories, models, fallback routes, and API endpoints are functionally fully integrated.

---

## Step 6: Launch Application
Start the FastAPI backend with database bindings:

```bash
.venv/bin/uvicorn app.main:app --reload
```
The console will log either a successful connection to the PostgreSQL target or fallback SQLite initialization.
