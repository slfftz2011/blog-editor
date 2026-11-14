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

export async function deleteFile(cfg: RepoConfig, path: string, message: string): Promise<void> {
  // 删除必须先查 SHA
  const getUrl = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(path)}?ref=${cfg.branch}`
  const getRes = await fetch(getUrl, { headers: headers(cfg.token) })
  await handle(getRes)
  const { sha } = await getRes.json()

  const delUrl = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(path)}`
  const delRes = await fetch(delUrl, {
    method: 'DELETE',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: cfg.branch }),
  })
  await handle(delRes)
}

export async function renameFile(
  cfg: RepoConfig,
  oldPath: string,
  newPath: string,
  message: string,
): Promise<void> {
  // 1. 获取旧文件内容和 SHA
  const oldUrl = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(oldPath)}?ref=${cfg.branch}`
  const getRes = await fetch(oldUrl, { headers: headers(cfg.token) })
  await handle(getRes)
  const oldData = await getRes.json()

  // 2. 在新路径创建文件
  const newUrl = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(newPath)}`
  const putRes = await fetch(newUrl, {
    method: 'PUT',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: oldData.content, // GitHub 返回的已经是 base64，直接用
      branch: cfg.branch,
    }),
  })
  await handle(putRes)

  // 3. 删除旧文件
  const delUrl = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(oldPath)}`
  const delRes = await fetch(delUrl, {
    method: 'DELETE',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha: oldData.sha, branch: cfg.branch }),
  })
  await handle(delRes)
}

export interface ImageItem {
  path: string      // 完整路径，如 source/images/post1/xxx.jpg
  name: string      // 文件名，如 xxx.jpg
  folder: string    // 所在目录，如 post1（相对于 imageDir）
  url: string       // 预览地址
  sha?: string
}

export async function listImages(cfg: RepoConfig): Promise<ImageItem[]> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/git/trees/${cfg.branch}?recursive=1`
  const res = await fetch(url, { headers: headers(cfg.token) })
  await handle(res)
  const data = await res.json()

  const imageDir = cfg.imageDir.replace(/\/+$/, '') + '/'
  const imgExts = /\.(jpe?g|png|gif|webp|svg)$/i
  const rawBase = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/`

  return (data.tree as any[])
    .filter(e => e.type === 'blob')
    .filter(e => e.path.startsWith(imageDir) && e.path.match(imgExts))
    .map(e => {
      const relativePath = e.path.substring(imageDir.length) // 例如 post1/xxx.jpg
      const parts = relativePath.split('/')
      const name = parts.pop() || ''
      const folder = parts.join('/') || '根目录'
      
      return {
        path: e.path,
        name,
        folder,
        url: rawBase + e.path,
        sha: e.sha
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))
}

export async function fetchHexoRoot(cfg: RepoConfig): Promise<string> {
  try {
    const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/_config.yml?ref=${cfg.branch}`
    const res = await fetch(url, { headers: headers(cfg.token) })
    if (!res.ok) return '/'
    const data = await res.json()
    const content = b64Decode(data.content)
    
    // 简单的正则提取，避免引入额外的 yaml 解析库
    const match = content.match(/^root:\s*['"]?([^'"\r\n]+)['"]?/m)
    if (match && match[1]) {
      let root = match[1].trim()
      if (!root.endsWith('/')) root += '/'
      if (!root.startsWith('/')) root = '/' + root
      return root
    }
  } catch (e) {
    console.error('读取 _config.yml 失败', e)
  }
  return '/'
}