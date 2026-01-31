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

- **Location**: Tests are located in `apps/e2e/tests`.
- **Base URL**: Configured in `apps/e2e/playwright.config.ts`.
- **Execution**: Run `pnpm --filter e2e-tests test`.

### Example (Smoke Test)

```typescript
import { test, expect } from "@playwright/test";

test("smoke test", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome")).toBeVisible();
});
```

## Integration Testing

Integration tests should be used for components that interact with external services (like Strapi) without mocking the entire network layer if possible, or by using dedicated test databases.

## CI/CD Integration

Tests are automatically executed on every push and pull request to the `main` branch via GitHub Actions. See [.github/workflows/ci.yml].
