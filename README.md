# Project Bot Monorepo

## Structure

### Apps
- **apps/website-host**: The main shell application (React + Vite).
- **apps/user-app**: The user application (Remote).
- **apps/admin-app**: The admin application (Remote).
- **apps/backend**: Backend service (Placeholder).

### Packages
- **packages/shared-flow**: Shared React Flow logic.
- **packages/ui-theme**: Shared UI components.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run all apps:
   ```bash
   pnpm dev
   ```

   - Host: http://localhost:5173 (or port shown in terminal)
   - User App: http://localhost:5001
   - Admin App: http://localhost:5002

## Module Federation
The host app consumes `userApp` and `adminApp` via `@module-federation/vite`.
