# Contributing

## Engineering Principles

- Keep forecast, risk, alert, and AI guidance boundaries separate.
- Do not call AI providers directly from route handlers.
- Do not let forecast models directly trigger notifications.
- Validate every external input at the service boundary.
- Keep frontend components functional, typed, accessible, and focused.
- Prefer deterministic business logic for operational safety decisions.

## Local Workflow

1. Create a focused branch.
2. Install frontend and backend dependencies.
3. Run linting, formatting checks, and tests before opening a pull request.
4. Update documentation when contracts, security behavior, prompts, or deployment steps change.

## Pull Request Checklist

- Tests added or updated for behavior changes.
- Accessibility implications reviewed.
- No `any` types introduced in TypeScript.
- Python functions include useful type hints.
- No secrets or local environment files committed.
- AI outputs, when introduced, are schema validated.
- Prompt changes include regression fixtures.

## Commit Messages

Use concise conventional-style messages:

- `feat: add health endpoint`
- `fix: tighten cors origin parsing`
- `test: cover app shell rendering`
- `docs: update backend setup`

