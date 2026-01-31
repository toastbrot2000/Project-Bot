# @project-bot/ui-theme

Design tokens and theming system for Project Bot.

## 📦 Installation

```bash
pnpm add @project-bot/ui-theme@workspace:*
```

## 🎯 Purpose

Centralize design tokens (colors, spacing, typography) for consistent theming across all apps.

## ✨ Features

- CSS custom properties for runtime theme switching
- TypeScript types for theme tokens
- Light/dark mode support (planned)

## 🛠️ Usage

```typescript
import { theme } from '@project-bot/ui-theme';

const MyComponent = () => {
  return (
    <div style={{ color: theme.colors.primary }}>
      Themed content
    </div>
  );
};
```

### CSS Variables

```css
:root {
  --color-primary: #...;
  --color-secondary: #...;
  --spacing-sm: 0.5rem;
  /* ... */
}
```

## 📖 Tokens

### Colors

- `primary`, `secondary`, `accent`
- `success`, `error`, `warning`, `info`
- `background`, `foreground`

### Spacing

Standard spacing scale (0.25rem increments)

### Typography

Font families, sizes, weights, line heights

---

**For AI Agents**: Design token centralization. Exports theme object and CSS custom properties. Used alongside @project-bot/tailwind-config for comprehensive styling solution.
