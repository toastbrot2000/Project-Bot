# Testing Infrastructure

We use a unified testing strategy across our monorepo powered by **Vitest** (Unit/Integration) and **Playwright** (E2E).

## 🚀 Quick Start

- **Unit & Integration Tests**:

  ```bash
  pnpm test
  ```

  _(Runs recursively `pnpm -r test` in each app, excluding e2e folders)_

- **E2E Tests** (Playwright):

  ```bash
  pnpm test:e2e
  ```

  _(Runs Playwright using the configuration in `tests/e2e/`)_

- **Affected Packages Only**:
  ```bash
  pnpm test:affected
  ```
  _(Runs tests only for packages changed relative to `origin/main`)_

## 🏗️ Architecture

### 1. Root & App Configuration

- **Root**:

  - `vitest.config.base.ts`: Shared Vitest configuration template.
  - `tests/e2e/playwright.config.ts`: Central Playwright runner config.
  - `package.json`: Configured to run `pnpm -r test`, ensuring each app runs tests in its own context.

- **Apps** (`apps/<app>/vitest.config.ts`):
  - Each app extends or duplicates necessary config from the base.
  - **Crucially**: `react` and `react-dom` are aliased to local `node_modules` to prevent "Invalid Hook Call" and "Duplicate React" errors common in pnpm monorepos.
  - **Exclusions**: Strict `exclude` patterns prevent Vitest from running Playwright `.spec.ts` files.

### 2. File Structure

Each app (`apps/<app>`) has its own `test/` directory:

- `test/unit/`: Pure logic tests (fast, no DOM).
- `test/integration/`: Component tests (checking rendering, hooks).
- `test/e2e/`: Playwright spec files (`.spec.ts`).

## 🛡️ Guidelines

### Selectors

Always use `data-testid` attributes (e.g., `data-testid="app-root"`). Do not use brittle CSS selectors.

### Mocking Strategy

- **External APIs**: Mock side-effects (like `fetch` or `useChatFlow`).
- **Module Federation**: For Integration tests, **mock** Remote Modules (e.g., `userApp/Main`) to avoid build-time resolution errors.
- **Shared UI**: If you encounter React Context conflicts (e.g., `ToastProvider`), mock the shared UI component or alias React to the local package.

### Contract Protection

- Ensure shared constants and types from `packages/` are validated in consumer apps.
- `tests/e2e/playwright.config.ts` serves as the centralized E2E contract runner.

## 📝 Troubleshooting

### "Invalid Hook Call" / Duplicate React

If you see this error during tests, ensure the `vitest.config.ts` in the failing app has the `alias` for `react` pointing to `path.resolve(__dirname, 'node_modules/react')`. This forces Vitest to resolve the local React instance instead of hoisting it.

### "Module Federation" Errors

Integration tests in `website-host` intentionally **bypass** remote loading by mocking the imports. For real federation testing, use `pnpm test:e2e` against the running dev servers.
