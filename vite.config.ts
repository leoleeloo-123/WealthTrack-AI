import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Safely map the process.env.API_KEY. 
      // JSON.stringify ensures it's treated as a string literal in the client code.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  }
})