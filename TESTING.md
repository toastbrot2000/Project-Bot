# Testing Guidelines

This document outlines the testing strategy and patterns for Project Bot.

## Unit Testing (Vitest)

We use **Vitest** for unit testing logic in both `apps` and `packages`.

### Patterns

- **Location**: Place `.test.ts` or `.test.js` files next to the implementation.
- **Mocking**: Use `vi.stubGlobal` for global mocks (e.g., `fetch`) and `vi.mock` for module-level mocks.
- **Execution**: Run `pnpm test` from the root to execute all tests in the monorepo.

### Example (Service Test)

```javascript
import { describe, it, expect, vi } from "vitest";
import { myService } from "./myService";

describe("myService", () => {
  it("should do something", async () => {
    // ...
  });
});
```

## E2E Testing (Playwright)

We use **Playwright** for end-to-end smoke tests and critical flow verification.

### Patterns

- **Location**: Tests are located in `tests/e2e/tests/`.
- **Base URL**: Configured in `tests/e2e/playwright.config.ts`.
- **Execution**: Run `pnpm test:e2e` from the root.

### Example (Smoke Test)

```typescript
import { test, expect } from "@playwright/test";

test("smoke test", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome")).toBeVisible();
});
```

## 🏗️ Architecture Note

- **Vitest**: Each app has its own `vitest.config.ts` extending a base config. **Crucially**: React is aliased to local `node_modules` to prevent duplicate React errors in the monorepo.
- **Strapi**: The backend boots in E2E via a dedicated webserver config that provides dummy secrets and sqlite database paths.

## 📝 Troubleshooting

### Duplicate React / Hook Errors

If Vitest fails with React errors, ensure the app's `vitest.config.ts` alias points `react` to its local `node_modules`.

### CI WebServer Failure (Strapi)

If Strapi crashes in CI, check:

1. **PNPM v10**: Authorization for `better-sqlite3` and `sharp` must be in `pnpm.onlyBuiltDependencies` in the root `package.json`.
2. **Network**: Use `127.0.0.1` instead of `localhost` in the Playwright config.

## CI/CD Integration

Tests are automatically executed on every push and pull request to the `main` branch via GitHub Actions. See [.github/workflows/ci.yml].
