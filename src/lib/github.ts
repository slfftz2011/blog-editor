import type { RepoConfig, FileItem } from '../types'

const API = 'https://api.github.com'

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function handle(res: Response): Promise<Response> {
  if (res.ok) return res
  let msg = `HTTP ${res.status}`
  try {
    const data = await res.json()
    msg = data.message || msg
  } catch {}
  if (res.status === 401) msg = '认证失败：PAT 无效或已过期'
  else if (res.status === 403) msg = '权限不足：确认 PAT 有该仓库 Contents 读写权限'
  else if (res.status === 404) msg = '仓库或路径不存在'
  throw new Error(msg)
}

function b64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach(b => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

function b64Decode(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export async function testConnection(cfg: RepoConfig): Promise<string> {
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}`, {
    headers: headers(cfg.token),
  })
  await handle(res)
  const data = await res.json()
  return `已连接 ${data.full_name}，默认分支 ${data.default_branch}`
}

export async function listMdFiles(cfg: RepoConfig): Promise<FileItem[]> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/git/trees/${cfg.branch}?recursive=1`
  const res = await fetch(url, { headers: headers(cfg.token) })
  await handle(res)
  const data = await res.json()
  const prefix = cfg.postsPath.replace(/\/+$/, '') + '/'
  return (data.tree as any[])
    .filter(e => e.type === 'blob')
    .filter(e => e.path.startsWith(prefix) && e.path.toLowerCase().endsWith('.md'))
    .map(e => ({ path: e.path, name: e.path.substring(prefix.length) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function readFile(
  cfg: RepoConfig,
  path: string,
): Promise<{ content: string; sha: string }> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(path)}?ref=${cfg.branch}`
  const res = await fetch(url, { headers: headers(cfg.token) })
  await handle(res)
  const data = await res.json()
  return { content: b64Decode(data.content), sha: data.sha }
}

export async function writeFile(
  cfg: RepoConfig,
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<void> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(path)}`
  const body: any = { message, content: b64Encode(content), branch: cfg.branch }
  if (sha) body.sha = sha
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  await handle(res)
}

export async function uploadBinaryFile(
  cfg: RepoConfig,
  path: string,
  base64Content: string,
  message: string,
): Promise<void> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(path)}`
  const body = {
    message,
    content: base64Content,
    branch: cfg.branch,
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  await handle(res)
}