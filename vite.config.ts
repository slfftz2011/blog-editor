import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
// CI 里 GITHUB_REF_NAME 是 tag（如 v0.1.0-beta.1）；本地开发回退到 package.json
const version = (process.env.GITHUB_REF_NAME || 'v' + pkg.version).replace(/^v/, '')

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})