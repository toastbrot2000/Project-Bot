/** @type {import('tailwindcss').Config} */
import sharedConfig from '@project-bot/tailwind-config';

export default {
    ...sharedConfig,
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../packages/ui/src/**/*.{ts,tsx}"
    ],
}
