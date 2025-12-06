import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize system/Vercel environment variables, then falls back to .env file
  // This matches the key "API_KEY" you set in Vercel
  const apiKey = process.env.API_KEY || env.API_KEY || '';

  if (!apiKey) {
    console.warn("⚠️  WARNING: API_KEY is missing in the build environment. The AI features will not work.");
  } else {
    console.log("✅ Success: API_KEY detected during build (" + apiKey.length + " characters).");
  }

  return {
    plugins: [react()],
    define: {
      // Safely map the process.env.API_KEY to the build-time value for use in the browser
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})