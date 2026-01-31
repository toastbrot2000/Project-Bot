# @project-bot/ui

Shared UI component library for Project Bot applications.

## 📦 Installation

```bash
pnpm add @project-bot/ui@workspace:*
```

## 🎯 Purpose

Provide reusable, consistent UI components across all Project Bot micro-frontends.

## ✨ Available Components

### Button

Standard button component with variants.

```typescript
import { Button } from '@project-bot/ui';

<Button variant="primary" size="lg">
  Click Me
</Button>
```

**Props**:

- `variant`: `"primary" | "secondary" | "outline" | "ghost"`
- `size`: `"sm" | "md" | "lg"`
- All standard HTML button props

### Toast/ToastProvider

Toast notification system.

```typescript
import { ToastProvider, useToast } from '@project-bot/ui';

// In your app root
<ToastProvider>
  <App />
</ToastProvider>

// In any component
const { showToast } = useToast();
showToast({ message: 'Success!', type: 'success' });
```

### Card

Container component with glassmorphism styling.

```typescript
import { Card } from '@project-bot/ui';

<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

### (Add other components as they're created)

## 🛠️ Tech Stack

- **React 19**: Peer dependency
- **Tailwind CSS**: Via `@project-bot/tailwind-config`
- **Class Variance Authority**: For component variants
- **clsx** + **tailwind-merge**: Utility class management
- **lucide-react**: Icon library

## 🎨 Styling

All components use Tailwind CSS and extend the shared configuration:

```typescript
import { cn } from '@project-bot/ui/utils';

const MyComponent = ({ className }) => {
  return (
    <div className={cn('base-classes', className)}>
      Content
    </div>
  );
};
```

## 🧪 Usage in Apps

```typescript
// apps/admin-app/src/Component.tsx
import { Button, Card } from '@project-bot/ui';

export const Dashboard = () => {
  return (
    <Card>
      <Button>Action</Button>
    </Card>
  );
};
```

## 📖 Related Documentation

- [ARCHITECTURE.md](file:///c:/xampp/htdocs/Project%20Bot/ARCHITECTURE.md)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

**For AI Agents**: Components exported from `src/index.ts`. Uses CVA for variants. Tailwind classes via `cn()` utility. Peer dependencies: React 19, ReactDOM 19. Icons from lucide-react.
