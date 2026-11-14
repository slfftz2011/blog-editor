import type { RepoConfig } from '../types'

const KEY = 'blog-editor-config'

export const defaultConfig: RepoConfig = {
  owner: '',
  repo: '',
  branch: 'dev',
  token: '',
  postsPath: 'source/_posts',
  imageDir: 'source/images',
  imageUrlPrefix: '/img',
  pagesBaseUrl: '',
  root: '/',
}

export function loadConfig(): RepoConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultConfig
    return { ...defaultConfig, ...JSON.parse(raw) }
  } catch {
    return defaultConfig
  }
}

export function saveConfig(cfg: RepoConfig): void {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}