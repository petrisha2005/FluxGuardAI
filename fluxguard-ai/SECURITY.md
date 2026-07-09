# Security Policy

## Reporting

Do not open public issues for security concerns. Share the affected component, reproduction steps, expected impact, and relevant logs through the private reporting process defined by the project maintainers.

## Baseline Rules

- Never commit secrets, API keys, tokens, or production data.
- Use `.env.example` files to document configuration.
- Keep Claude and Supabase credentials out of frontend code.
- Validate and sanitize all external inputs before persistence or AI context construction.
- Return safe error messages to clients.
- Keep operational guidance generation behind backend services.

## AI Safety Rules

- LLM output must never be treated as a source of truth for crowd risk.
- AI guidance must be schema validated before display or storage.
- Prompt templates must be version controlled.
- Deterministic fallback guidance must exist before production AI calls are enabled.

See [docs/SECURITY.md](docs/SECURITY.md) for the full threat model.

