# Prompt Templates

Prompt templates for FluxGuard AI must be version-controlled and reviewed like application code.

Rules:

- Store templates by role and version.
- Do not include secrets or production-only operational details.
- Every AI response must be validated against a JSON schema before delivery.
- Prompt changes require regression tests before production use.

The first executable prompt templates will be added when Claude integration begins.

