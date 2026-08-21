---
name: neobrutalism-ui-auditor
description: >
  Audits and enforces the Neobrutalist design system in React/Tailwind
  components. Checks high-contrast solid borders (border-3 border-black),
  hard offset shadows (shadow-neo), interactive tactile clicks, typography,
  and accessibility aria-labels.
argument-hint: "[components_dir]"
license: MIT
---

# Neobrutalism UI Auditor

Ensures all frontend components adhere strictly to the GoodFoods Neobrutalist Design System.

## Design Token Rules

1. **Borders**:
   - Primary elements (cards, headers, modals): `border-3 border-black`
   - Secondary elements (badges, buttons, inputs): `border-2 border-black`
   - Never use borderless cards or soft diffused rounded pill shadows.

2. **Shadows**:
   - Standard cards: `shadow-neo` (`4px 4px 0px 0px #000`)
   - Large modals/dialogs: `shadow-neo-xl` (`8px 8px 0px 0px #000`)
   - Interactive button clicks:
     ```css
     hover:-translate-y-0.5 hover:shadow-neo-lg
     active:translate-x-0.5 active:translate-y-0.5 active:shadow-neo-sm
     ```

3. **Color Accents**:
   - `bg-neo-yellow` (`#FFE600`): User message bubbles, primary CTA triggers.
   - `bg-neo-green` (`#4ADE80`): Confirmed reservations, available slots.
   - `bg-neo-blue` (`#38BDF8`): Restaurant directory, informational tiles.
   - `bg-neo-purple` (`#A78BFA`): AI Engine switcher, model metadata.
   - `bg-neo-canvas` (`#F4EFE6`): Canvas background with retro dot matrix pattern.

4. **Accessibility Checklist**:
   - Every icon-only button must contain `aria-label="..."`.
   - Every input field must have an associated label or `placeholder` + `aria-label`.
   - `ErrorBoundary` must wrap the root application tree.

## Verification Command

```bash
cd frontend && npm run build
```
