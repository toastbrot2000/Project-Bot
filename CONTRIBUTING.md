# Contributing to Project Bot

Thank you for your interest in contributing to Project Bot! This document provides guidelines and workflows for contributing to this monorepo.

## 🚀 Getting Started

### Prerequisites

- Node.js v20+ (v22 recommended)
- pnpm v9+
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/toastbrot2000/Project-Bot.git
   cd Project-Bot
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start the development environment**:

   ```bash
   pnpm dev
   ```

4. **Verify the setup**:
   - Open [http://localhost:5173](http://localhost:5173)
   - All apps should load without errors

## 📝 Code Style and Conventions

### TypeScript

- **Strict mode enabled**: All TypeScript code uses strict type checking
- **No `any` types**: Use proper types or `unknown` if type is genuinely unknown
- **Explicit return types**: For public functions and exported utilities
- **Interface over type**: Use `interface` for object shapes, `type` for unions/intersections

### React

- **Functional components**: Always use function components, never class components
- **Hooks**: Follow [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- **PropTypes**: Use TypeScript interfaces instead of PropTypes
- **Component files**:
  - One component per file
  - File name matches component name (e.g., `Dashboard.tsx` for `Dashboard` component)

### Naming Conventions

- **Files**:

  - Components: `PascalCase.tsx`
  - Utilities: `camelCase.ts`
  - Hooks: `use CamelCase.ts`
  - Constants: `UPPER_SNAKE_CASE.ts`

- **Variables**:
  - `camelCase` for variables and functions
  - `PascalCase` for components and classes
  - `UPPER_SNAKE_CASE` for constants

### CSS/Styling

- **Tailwind CSS**: Use Tailwind utility classes for styling
- **Shared design tokens**: Reference `@project-bot/tailwind-config` for consistency
- **Custom CSS**: Only when Tailwind is insufficient; use CSS modules
- **No inline styles**: Avoid `style={{...}}` except for dynamic values

### File Organization

```typescript
// 1. External imports (libraries)
import React from "react";
import { useNavigate } from "react-router-dom";

// 2. Internal imports (workspace packages)
import { Button } from "@project-bot/ui";

// 3. Relative imports (local modules)
import { useAppState } from "./hooks/useAppState";
import "./Dashboard.css";

// 4. Type-only imports (last)
import type { DashboardProps } from "./types";
```

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

**Branch naming**:

- `feature/` - New features (e.g., `feature/add-export-button`)
- `fix/` - Bug fixes (e.g., `fix/edge-selection-bug`)
- `docs/` - Documentation updates
- `refactor/` - Code refactoring without behavior changes
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks (dependencies, tooling)

### 2. Make Your Changes

- Write clean, readable code
- Follow the code style guidelines
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linter
pnpm lint

# Run unit tests
pnpm test

# Run affected tests only
pnpm test:affected

# Run E2E tests (if applicable)
pnpm test:e2e
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
git commit -m "feat(admin-app): add edge deletion functionality"
git commit -m "fix(user-app): resolve chat scroll issue on mobile"
git commit -m "docs: update README with new architecture diagram"
git commit -m "test(website-host): add integration tests for routing"
```

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🧪 Testing Requirements

### Unit Tests

Required for:

- Utility functions
- Custom hooks
- Business logic

**Location**: `apps/*/test/unit/`

**Example**:

```typescript
// apps/admin-app/test/unit/nodeUtils.test.ts
import { describe, it, expect } from "vitest";
import { calculateNodePosition } from "../../src/utils/nodeUtils";

describe("calculateNodePosition", () => {
  it("should calculate correct position for centered node", () => {
    const result = calculateNodePosition(100, 100, "center");
    expect(result).toEqual({ x: 50, y: 50 });
  });
});
```

### Integration Tests

Required for:

- Component rendering
- User interactions
- React Flow integrations

**Location**: `apps/*/test/integration/`

**Example**:

```typescript
// apps/admin-app/test/integration/FlowModeler.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlowModeler } from '../../src/components/FlowModeler';

describe('FlowModeler', () => {
  it('should render flow canvas', () => {
    render(<FlowModeler />);
    expect(screen.getByTestId('flow-canvas')).toBeInTheDocument();
  });
});
```

### E2E Tests

Required for:

- New user flows
- Critical features
- Cross-app interactions

**Location**: `apps/*/test/e2e/`

**Example**:

```typescript
// apps/admin-app/test/e2e/flow-editor.spec.ts
import { test, expect } from "@playwright/test";

test("should create and delete a node", async ({ page }) => {
  await page.goto("/dashboard");

  // Create node
  await page.click('[data-testid="add-node-btn"]');
  await expect(page.locator('[data-testid="flow-node"]')).toBeVisible();

  // Delete node
  await page.click('[data-testid="flow-node"]');
  await page.keyboard.press("Delete");
  await expect(page.locator('[data-testid="flow-node"]')).not.toBeVisible();
});
```

### Test Coverage

- Aim for **80%+ coverage** for critical business logic
- **100% coverage** for utility functions
- Focus on **behavior testing**, not implementation details

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is properly formatted
- [ ] Documentation is updated
- [ ] Screenshots/videos included for UI changes
- [ ] Breaking changes are documented

### PR Template

Create PR using the template in `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots/Recordings

(if applicable)

## Checklist

- [ ] Code follows project conventions
- [ ] Self-review performed
- [ ] Documentation updated
- [ ] No console errors/warnings
```

### PR Review Process

1. **Automated checks**: CI must pass before review
2. **Code review**: At least one approver required
3. **Testing**: Reviewer should test changes locally
4. **Approval**: PR can be merged after approval

## 🔍 Code Review Guidelines

### As a Reviewer

- **Be constructive**: Suggest improvements, don't just criticize
- **Ask questions**: Understand the reasoning before suggesting changes
- **Prioritize**: Distinguish between "must fix" and "nice to have"
- **Test locally**: Actually run the code, don't just read it
- **Respond promptly**: Aim to review within 24 hours

### Common Review Points

- **Functionality**: Does it work as intended?
- **Performance**: Any noticeable slowdowns?
- **Security**: Any vulnerabilities introduced?
- **Accessibility**: Keyboard navigation, screen readers
- **Error handling**: Edge cases covered?
- **Code clarity**: Is it easy to understand?

## 🏗️ Working with Workspaces

### Adding Dependencies

```bash
# Add to specific workspace
pnpm --filter admin-app add react-query

# Add to root (dev dependency)
pnpm add -D -w prettier

# Add to shared package
pnpm --filter @project-bot/ui add clsx
```

### Creating a New Shared Package

1. Create directory: `packages/my-package/`
2. Add `package.json`:
   ```json
   {
     "name": "@project-bot/my-package",
     "version": "0.0.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts"
   }
   ```
3. Update `pnpm-workspace.yaml` if needed (usually automatic for `packages/*`)
4. Use in apps: `pnpm --filter admin-app add @project-bot/my-package@workspace:*`

## 🐛 Reporting Bugs

### Before Reporting

- Search existing issues
- Verify it's reproducible on latest `main` branch
- Check if it's a known issue in [CHANGELOG.md](file:///c:/xampp/htdocs/Project%20Bot/CHANGELOG.md)

### Bug Report Template

```markdown
**Describe the bug**
Clear description of what the bug is

**To Reproduce**

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**:

- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node version: [e.g. v20.9.0]
- pnpm version: [e.g. 9.0.0]
```

## 💡 Feature Requests

Feature requests are welcome! Please include:

- **Use case**: Why is this needed?
- **Proposed solution**: How would it work?
- **Alternatives**: Other approaches considered
- **Mockups**: Visual representation if UI change

## 📞 Getting Help

- **Documentation**: Check [README.md](file:///c:/xampp/htdocs/Project%20Bot/README.md), [ARCHITECTURE.md](file:///c:/xampp/htdocs/Project%20Bot/ARCHITECTURE.md), and [TESTING.md](file:///c:/xampp/htdocs/Project%20Bot/TESTING.md)
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**For AI Agents**: Key files to understand before contributing: Code style in this file, test patterns in TESTING.md, architecture in ARCHITECTURE.md. Run `pnpm lint` and `pnpm test` before committing. Use conventional commits format for commit messages.
