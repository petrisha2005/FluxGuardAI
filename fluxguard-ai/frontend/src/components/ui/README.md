# FluxGuard AI UI Foundations

This package contains reusable command-center UI primitives. These components are intentionally feature-neutral: they do not fetch data, render dashboards, call APIs, or encode crowd-management business logic.

## Components

- `Button`: Action control with variants, sizes, loading state, disabled state, and optional icons.
- `Card`: Reusable content container with optional title, description, and actions.
- `Badge`: Compact status label with `safe`, `warning`, `critical`, and `info` variants.
- `StatusIndicator`: Crowd risk state indicator for `green`, `amber`, and `red`.
- `MetricCard`: Compact metric display for values such as density, predicted risk, or time.
- `AlertCard`: AI operations alert container with severity, title, description, and timestamp.
- `Panel`: Dashboard section shell for future command-center layouts.
- `Skeleton`: Accessible loading placeholder.
- `Spinner`: Accessible loading indicator.
- `Tooltip`: Keyboard and pointer accessible helper text.

## Usage Guidelines

- Use `Panel` for large command-center sections and `Card` for smaller grouped content.
- Use `MetricCard` only for summary values. Detailed charts and analytics belong in future feature modules.
- Use `Badge` and `StatusIndicator` together when color alone would be insufficient.
- Use `AlertCard` for rendered operational messages only after backend validation in future AI flows.
- Keep component props declarative and data-only. Do not put API calls or business rules inside UI primitives.

## Accessibility Rules

- Every interactive control must have a clear accessible name.
- Do not rely on color alone for safe, warning, or critical states.
- Loading states must expose `role="status"` or `aria-busy`.
- Tooltips must appear on keyboard focus as well as pointer hover.
- Disabled controls must use the native `disabled` attribute when possible.
- Motion must be short, non-essential, and compatible with reduced-motion preferences from global styles.

## Design Language

The visual system uses a dark command-center theme:

- Primary: AI intelligence and operator trust.
- Secondary: real-time movement and telemetry.
- Safe: green.
- Warning: amber.
- Critical: red.
- Neutral: dark slate surfaces with high-contrast text.
