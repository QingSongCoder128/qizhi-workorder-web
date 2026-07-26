import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'element-vendor',
              test: /node_modules[\\/](element-plus|@element-plus)/,
              maxSize: 350000,
              priority: 20
            },
            {
              name: 'charts-vendor',
              test: /node_modules[\\/](echarts|zrender)/,
              maxSize: 350000,
              priority: 15
            },
            {
              name: 'vue-vendor',
              test: /node_modules[\\/](vue|vue-router|pinia|@vue)/,
              priority: 10
            }
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:10001',
        changeOrigin: true
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *;`
      }
    }
  }
})
