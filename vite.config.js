import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    // Served from the apex of a custom domain, so assets live at the root.
    // Preview builds pass their own --base on the command line.
    base: '/',
})
