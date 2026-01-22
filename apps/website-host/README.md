# Website Host (Shell)

The **Website Host** is the main entry point (Shell) for the Project Bot platform. It is responsible for:

1.  **Layout**: Providing the global header, footer, and navigation.
2.  **Routing**: Mapping URLs to specific Micro-Frontends (MFEs).
3.  **Module Federation**: Loading remote applications (`User App`, `Admin App`) lazily.

## Tech Stack
- **Vite** + **React** (TypeScript)
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **@module-federation/vite** for orchestration

## Development
Run `pnpm dev` in the root (or `pnpm dev` inside this folder) to start usually on port `5173`.
