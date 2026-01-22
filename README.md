# Project Bot Monorepo

Welcome to **Project Bot**, a modular micro-frontend platform designed to orchestrate complex assessment workflows and visual flow modeling.

## 🚀 Overview

Project Bot utilizes a modern **Micro-Frontend Architecture** powered by **Vite Module Federation**. This allows for independent development and deployment of the different parts of the application while maintaining a cohesive user experience.

### Architecture
The project is organized as a Monorepo using `pnpm workspaces`.

- **Host Application (`apps/website-host`)**: The "Shell" that loads other applications. It handles routing, layout, and cross-cutting concerns (authentication, theming).
- **User Application (`apps/user-app`)**: The client-facing assessment tool. It features a rich chat interface for guided questions and answers.
- **Admin Application (`apps/admin-app`)**: The administrative dashboard. It includes a powerful visual Flow Modeler (based on React Flow) to design the assessment logic.
- **Modules Application (`apps/modules-app`)**: A repository of shared logic and independent features.
- **Backend Application (`apps/backend`)**: The Headless CMS (Strapi) handling data persistence and content management.
- **Shared Packages (`packages/*`)**: Reusable logic and UI components shared across applications.

## 🛠️ Tech Stack

- **Framework**: React 18+
- **Build Tool**: Vite 6+
- **Module Federation**: `@module-federation/vite`
- **Language**: TypeScript / JavaScript
- **Styling**: Tailwind CSS (Host), CSS Modules / Global CSS (Remotes)
- **State Management**: React Context / Hooks
- **Visual Modeling**: React Flow

## ⚡ Getting Started

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **pnpm**: v9+ (Install via `npm install -g pnpm`)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project-bot
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```
   This command installs dependencies for the root workspace and all applications/packages.

### Development

To start the entire platform (Host + Remotes) in parallel:

```bash
pnpm dev
```

The applications will inherit the following ports:
- **Host**: [http://localhost:5173](http://localhost:5173)
- **User App**: [http://localhost:5001](http://localhost:5001) (Remote Entry)
- **Host**: [http://localhost:5173](http://localhost:5173)
- **User App**: [http://localhost:5001](http://localhost:5001) (Remote Entry)
- **Admin App**: [http://localhost:5002](http://localhost:5002) (Remote Entry)
- **Backend**: [http://localhost:1337](http://localhost:1337) (API/Admin Panel)

Navigate to **[http://localhost:5173](http://localhost:5173)** to see the full application.

## 📂 Project Structure

```
project-bot/
├── apps/
│   ├── website-host/      # Main Shell App (The entry point)
│   ├── user-app/          # User Assessment Chat Flow
│   ├── admin-app/         # Admin Flow Modeler
│   └── backend/           # Strapi Headless CMS
├── packages/
│   ├── shared-flow/       # Shared logic for React Flow
│   └── ui-theme/          # Shared Design Tokens
├── package.json           # Root configuration
└── pnpm-workspace.yaml    # Workspace definition
```

