import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Der Dev-Server leitet /api an das .NET-Backend weiter (damit ist kein CORS nötig).
// Der Build landet in wwwroot des Backends, damit später ein Prozess/Port reicht.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../backend/OpenRouterModelPicker.Api/wwwroot',
    emptyOutDir: true,
  },
})
