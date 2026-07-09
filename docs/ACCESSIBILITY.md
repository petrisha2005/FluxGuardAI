# Accessibility

## WCAG Compliance

FluxGuard AI should target WCAG 2.1 AA for all core workflows.

Core requirements:

- Perceivable status and alert information.
- Operable dashboards and forms without a mouse.
- Understandable guidance language.
- Robust semantic structure for assistive technologies.

## Keyboard Navigation

- Every interactive element must be reachable by keyboard.
- Focus indicators must be visible.
- Modal dialogs must trap focus and restore focus on close.
- Alert actions must have predictable tab order.
- Map alternatives must exist for keyboard and screen reader users.

## ARIA

- Use semantic HTML first.
- Use ARIA only when native semantics are insufficient.
- Live alert regions should announce urgent status changes.
- Charts need text summaries.
- Icon-only buttons require accessible labels.

## Responsive Design

- Fan and volunteer experiences must work on small mobile screens.
- Operator dashboards must support dense desktop views.
- Layouts must avoid horizontal scrolling for core workflows.
- Touch targets should be at least 44 by 44 CSS pixels.

## Color Contrast

- Normal text contrast: at least 4.5:1.
- Large text contrast: at least 3:1.
- Status colors must not be the only indicator of severity.
- Use labels, icons, and patterns alongside color.

## Screen Reader Support

- Provide meaningful page titles and headings.
- Announce new alerts and guidance updates.
- Provide table summaries for zone risk lists.
- Provide text equivalents for maps and charts.
- Avoid auto-updating content that steals focus.

