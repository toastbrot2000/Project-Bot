# Architecture Documentation

## Overview

Project Bot is built as a **monorepo** using **pnpm workspaces** with a **micro-frontend architecture** powered by **Vite Module Federation**. This architecture enables independent development, testing, and deployment of applications while sharing common dependencies and components.

## Monorepo Structure

### Why Monorepo?

- **Code Sharing**: Shared packages (`@project-bot/*`) are easily consumed across apps
- **Atomic Changes**: Update shared code and consumers in a single commit
- **Unified Tooling**: Consistent linting, testing, and build configuration
- **Dependency Management**: Single `pnpm-lock.yaml` ensures version consistency
- **Simplified CI/CD**: Single pipeline for all apps with affected package detection

### Workspace Organization

```
project-bot/
├── apps/               # Application workspaces
├── packages/           # Shared library workspaces
├── tests/              # Centralized E2E tests
├── tooling/            # Build and deployment scripts
└── pnpm-workspace.yaml # Workspace configuration
```

**Workspace Protocol**: Packages reference each other using `workspace:*` in `package.json`, e.g.:

```json
{
  "dependencies": {
    "@project-bot/ui": "workspace:*"
  }
}
```

## Micro-Frontend Architecture

### Overview

The application uses **Vite Module Federation** to create a runtime-composable micro-frontend system. This allows:

- Independent deployment of each micro-frontend
- Runtime loading of remote modules
- Shared dependencies to prevent duplication
- Type-safe imports across federated modules

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│          website-host (Shell/Host)              │
│         http://localhost:5173                   │
│                                                 │
│  ┌─────────────┐  ┌───────────────────────┐   │
│  │   Layout    │  │   React Router        │   │
│  │  (Header/   │  │   (Route Mapping)     │   │
│  │   Footer)   │  └───────────────────────┘   │
│  └─────────────┘                                │
│                                                 │
│  Dynamically loads: extends:                    │
│                                                 │
└────────┬────────────────┬──────────────────────┘
         │                │
         ▼                ▼
┌─────────────────┐  ┌──────────────────┐
│    user-app     │  │   admin-app      │
│ (Remote MFE)    │  │  (Remote MFE)    │
│ :5001           │  │  :5002           │
│                 │  │                  │
│ Exposes:        │  │ Exposes:         │
│ - ./Main        │  │ - ./Dashboard    │
└────────┬────────┘  └────────┬─────────┘
         │                    │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │  Shared Packages   │
         │                    │
         │  @project-bot/ui   │
         │  @project-bot/     │
         │   shared-flow      │
         │  @project-bot/     │
         │   tailwind-config  │
         └────────────────────┘
```

### Module Federation Configuration

#### Host (website-host)

**File**: `apps/website-host/vite.config.ts`

```typescript
federation({
  name: "website_host",
  remotes: {
    userApp: "http://localhost:5001/mf-manifest.json",
    adminApp: "http://localhost:5002/mf-manifest.json",
  },
  shared: ["react", "react-dom", "react-router-dom"],
});
```

#### Remote (admin-app)

**File**: `apps/admin-app/vite.config.ts`

```typescript
federation({
  name: "admin_app",
  filename: "remoteEntry.js",
  exposes: {
    "./Dashboard": "./src/Dashboard.tsx",
  },
  shared: ["react", "react-dom", "reactflow"],
});
```

### Loading Remote Modules

In the host application (`apps/website-host/src/App.tsx`):

```typescript
// Type declaration (remotes.d.ts)
declare module 'adminApp/Dashboard';

// Lazy loading
const AdminApp = React.lazy(() => import('adminApp/Dashboard'));

// Usage in routes
<Route path="/dashboard" element={
  <Suspense fallback={<Loading />}>
    <AdminApp />
  </Suspense>
} />
```

## Communication Patterns

### 1. Shared State via Context

Shared packages export React Context providers consumed byall apps:

```typescript
// packages/ui/src/ToastProvider.tsx
export const ToastProvider = ({ children }) => { /* ... */ };

// apps/website-host/src/App.tsx
import { ToastProvider } from '@project-bot/ui';

<ToastProvider>
  {/* Remotes can access toast context */}
</ToastProvider>
```

### 2. URL-based Navigation

Primary navigation happens via React Router in the host. Remotes can trigger navigation using `window.location` or shared router context.

### 3. Event-based Communication

For decoupled communication, apps use custom events:

```typescript
// admin-app emits event
window.dispatchEvent(new CustomEvent("flow-saved", { detail: flowData }));

// website-host listens
window.addEventListener("flow-saved", (e) => {
  console.log("Flow saved:", e.detail);
});
```

### 4. Shared API Client

Backend communication is centralized via a shared API client (future enhancement).

## Dependency Management

### pnpm Workspaces

- **Hoisting**: Dependencies are hoisted to root `node_modules` when possible
- **Isolation**: Each workspace can have isolated dependencies if needed
- **Peer Dependencies**: Shared packages declare `peerDependencies` for React, avoiding duplication

### Dependency Overrides

**Root `package.json`** defines overrides for security patches and version consistency:

```json
{
  "pnpm": {
    "overrides": {
      "undici": "^6.23.0",
      "vite@^5": "^5.4.21"
    }
  }
}
```

### Version Pinning

- **Exact versions** in `pnpm-lock.yaml` ensure reproducible builds
- **Frozen lockfile** in CI (`pnpm install --frozen-lockfile`) prevents unexpected updates

## Build Architecture

### Development Mode

```bash
pnpm dev
```

1. Starts all apps in parallel using `pnpm --parallel`
2. Each app runs Vite dev server with HMR
3. Module Federation serves live `mf-manifest.json`
4. Host loads remotes via HTTP requests to `:5001`, `:5002`

### Production Build

```bash
pnpm build
```

1. Builds each app independently
2. Module Federation generates static manifests and remote entries
3. Outputs to `apps/*/dist/`
4. Host and remotes can be deployed separately

### Build Order

No specific build order required - each app is self-contained. However, ensure:

- Shared packages are type-checked before consuming apps
- Remotes are built before integration testing

## Testing Architecture

### Unit Tests (Vitest)

- **Location**: `apps/*/test/unit/`
- **Scope**: Pure logic, utility functions
- **Execution**: `pnpm test` runs Vitest in each app

### Integration Tests (Vitest + Testing Library)

- **Location**: `apps/*/test/integration/`
- **Scope**: Component rendering, hooks, React integration
- **Mocking**: Module Federation remotes are mocked to avoid build-time dependencies

**Example** (`apps/website-host/vitest.config.ts`):

```typescript
alias: {
  'adminApp/Dashboard': '/test/remote-mock.tsx',
}
```

### E2E Tests (Playwright)

- **Location**: `tests/e2e/`
- **Scope**: Full application flows across micro-frontends
- **Execution**: `pnpm test:e2e` starts all servers and runs Playwright

**Key Configuration** (`tests/e2e/playwright.config.ts`):

- Starts all apps via `webServer` array
- Tests each app independently + integration scenarios
- Runs in CI with `retries: 2`

## CI/CD Pipeline

**File**: `.github/workflows/ci.yml`

### Pipeline Stages

1. **Install** (Dependencies)

   - `pnpm install --frozen-lockfile`
   - Cached in GitHub Actions

2. **Static Analysis** (Parallel)

   - `pnpm lint` - ESLint across all workspaces
   - `pnpm audit` - Security vulnerability scan

3. **Unit Tests** (Affected Packages)

   - `pnpm test:affected` - Only tests changed packages vs `origin/main`
   - Runs only on non-draft PRs

4. **E2E Tests** (Full Integration)
   - `pnpm test:e2e` - Playwright across all apps
   - Only runs if unit tests pass

### Affected Package Detection

Uses pnpm's built-in filter:

```bash
pnpm -r --filter "...[origin/main]" test
```

Compares current branch to `origin/main` and only runs tests for:

- Modified packages
- Packages that depend on modified packages

## Performance Considerations

### Code Splitting

- Each micro-frontend is lazily loaded
- React.lazy() for route-based splitting within apps
- Shared dependencies loaded once globally

### Bundle Size

- Shared packages reduce duplication across remotes
- Vite tree-shaking eliminates unused exports
- Modern browsers target ES modules for smaller payloads

### Runtime Performance

- Module Federation runtime overhead: ~10KB
- Manifest fetch + remote load: ~100-200ms (local dev)
- Production: Use CDN for remote entries to minimize latency

## Security Considerations

### Dependency Scanning

- `pnpm audit` in CI catches known vulnerabilities
- Overrides in root `package.json` patch critical issues

### Content Security Policy

Future enhancement: Configure CSP headers to restrict module loading sources.

### Remote Module Trust

All remotes are first-party (same organization). For third-party remotes, implement:

- Manifest validation
- Subresource Integrity (SRI) checks

## Deployment Strategies

### Strategy 1: Monolithic Deployment

- Build all apps: `pnpm build`
- Deploy entire `dist/` folder to static hosting
- Pros: Simple, atomic updates
- Cons: No independent deployment

### Strategy 2: Independent Deployment

- Deploy each `apps/*/dist/` to separate URLs
- Update host remote URLs via environment variables
- Pros: True micro-frontend independence
- Cons: Version compatibility management

### Strategy 3: Docker Compose

- Use provided `docker-compose.yml`
- Each app in separate container
- Nginx reverse proxy routes to containers
- See [DEPLOYMENT.md](file:///c:/xampp/htdocs/Project%20Bot/DEPLOYMENT.md) for details

## Future Architecture Enhancements

- **Server-Side Rendering (SSR)**: Vite SSR + Module Federation for better SEO
- **Progressive Web App (PWA)**: Service workers for offline support
- **Edge Deployment**: Deploy remotes to Cloudflare Workers
- **Dynamic Remote Loading**: Load remotes from database configuration
- **Micro-frontend Framework**: Abstract federation boilerplate into shared package

---

**For AI Agents**: Key architecture files to review: `pnpm-workspace.yaml` (workspace config), `apps/*/vite.config.ts` (federation setup), `tests/e2e/playwright.config.ts` (E2E orchestration), `.github/workflows/ci.yml` (CI pipeline). Module Federation remotes are declared in host's vite.config and consumed via dynamic imports.
