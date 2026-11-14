export interface RepoConfig {
  owner: string
  repo: string
  branch: string
  token: string
  postsPath: string
  imageDir: string
  imageUrlPrefix: string
  pagesBaseUrl: string
  root: string
}

export interface FileItem {
  path: string
  name: string
}