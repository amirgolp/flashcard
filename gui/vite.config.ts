import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/cards': 'http://localhost:8000',
      '/decks': 'http://localhost:8000',
      '/books': 'http://localhost:8000',
      '/generate': 'http://localhost:8000',
      '/search': 'http://localhost:8000',
      '/storage': 'http://localhost:8000',
    },
  },
})
