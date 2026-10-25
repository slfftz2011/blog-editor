import type { RepoConfig } from '../types'

const KEY = 'blog-editor-config'

export const defaultConfig: RepoConfig = {
  owner: 'slfftz2011',
  repo: 'blog',
  branch: 'dev',
  token: '',
  postsPath: 'source/_posts',
  imageDir: 'source/images',
  imageUrlPrefix: '/images',
  pagesBaseUrl: '',
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