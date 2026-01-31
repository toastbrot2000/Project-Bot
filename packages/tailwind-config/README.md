# @project-bot/tailwind-config

Shared Tailwind CSS configuration for consistent styling across Project Bot apps.

## 📦 Installation

```bash
pnpm add @project-bot/tailwind-config@workspace:*
```

## 🎯 Purpose

Provide centralized Tailwind configuration with shared:

- Design tokens (colors, spacing, typography)
- Custom utilities
- Plugin configurations

## 🛠️ Usage

Extend this configuration in your app's `tailwind.config.js`:

```javascript
// apps/admin-app/tailwind.config.js
export default {
  presets: [require("@project-bot/tailwind-config")],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}", // Include shared UI
  ],
  theme: {
    extend: {
      // Your app-specific customizations
    },
  },
};
```

## 🎨 Design Tokens

### Colors

```javascript
colors: {
  primary: '#...',
  secondary: '#...',
  // ... (defined in config)
}
```

### Spacing

Follows Tailwind defaults with custom extensions for glassmorphism and modern layouts.

### Typography

Custom font families and sizes for consistent branding.

## 🔌 Plugins

Includes:

- `tailwindcss-animate` - Animation utilities
- Custom glassmorphism utilities

## 📖 Customization

To override defaults in consuming apps:

```javascript
export default {
  presets: [require("@project-bot/tailwind-config")],
  theme: {
    colors: {
      // Override primary color
      primary: "#new-color",
    },
  },
};
```

---

**For AI Agents**: Shared Tailwind preset. Export from `index.js`. Used via `presets` in app-specific Tailwind configs. Includes tailwindcss-animate plugin and custom utilities for glassmorphism effects.
