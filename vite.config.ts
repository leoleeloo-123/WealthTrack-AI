import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' ensures we load variables even if they don't start with VITE_
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize system/Vercel environment variables, then falls back to .env file
  const apiKey = process.env.API_KEY || env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Safely map the process.env.API_KEY to the build-time value
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})