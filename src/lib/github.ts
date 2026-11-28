import type { RepoConfig, FileItem } from '../types'
import type { ThemeOption } from '../data/themes'

const API = 'https://api.github.com'

function headers(token: string): Record<string, string> {
  const safeToken = token.replace(/[^\x20-\x7E]/g, '').trim()
  return {
    Authorization: `Bearer ${safeToken}`,
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

export async function fetchHexoConfig(cfg: RepoConfig): Promise<{ root: string, postsPath: string, imageDir: string }> {
  const defaults = { root: '/', postsPath: 'source/_posts', imageDir: 'source/images' }
  try {
    const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/_config.yml?ref=${cfg.branch}`
    const res = await fetch(url, { headers: headers(cfg.token) })
    if (!res.ok) return defaults
    const data = await res.json()
    const content = b64Decode(data.content)
    
    // 提取 root
    let root = '/'
    const rootMatch = content.match(/^root:\s*['"]?([^'"\r\n]+)['"]?/m)
    if (rootMatch && rootMatch[1]) {
      root = rootMatch[1].trim()
      if (!root.endsWith('/')) root += '/'
      if (!root.startsWith('/')) root = '/' + root
    }

    // 提取 source_dir
    let sourceDir = 'source'
    const sourceMatch = content.match(/^source_dir:\s*['"]?([^'"\r\n]+)['"]?/m)
    if (sourceMatch && sourceMatch[1]) {
      sourceDir = sourceMatch[1].trim()
    }

    return {
      root,
      postsPath: `${sourceDir}/_posts`,
      imageDir: `${sourceDir}/images`
    }
  } catch (e) {
    console.error('读取 _config.yml 失败', e)
    return defaults
  }
}

export async function createBlogFromTemplate(
  cfg: RepoConfig,
  newRepoName: string,
  templateRepo: string = 'blog-template',
): Promise<string> {
  const url = `${API}/repos/${cfg.owner}/${templateRepo}/generate`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner: cfg.owner,
      name: newRepoName,
      description: 'Generated by BlogEditor',
      include_all_branches: true,
      private: false,
    }),
  })
  await handle(res)
  const data = await res.json()
  return data.full_name
}

export async function installTheme(
  cfg: RepoConfig,
  repoName: string,
  theme: ThemeOption,
): Promise<void> {
  const repoCfg = { ...cfg, repo: repoName }
  const branch = 'dev' // 模板的默认分支

  // 1. 获取当前分支的 head commit
  const refRes = await fetch(`${API}/repos/${cfg.owner}/${repoName}/git/ref/heads/${branch}`, { headers: headers(cfg.token) })
  await handle(refRes)
  const ref = await refRes.json()
  const latestCommitSha = ref.object.sha

  // 2. 获取当前 commit 的 tree
  const commitRes = await fetch(`${API}/repos/${cfg.owner}/${repoName}/git/commits/${latestCommitSha}`, { headers: headers(cfg.token) })
  await handle(commitRes)
  const commit = await commitRes.json()
  const baseTreeSha = commit.tree.sha

  const newTree: any[] = []

  // 3. 准备新的 _config.yml 改动
  const { content: configContent } = await readFile(repoCfg, '_config.yml')
  const newConfigContent = configContent.replace(/^theme:\s*.*$/m, `theme: ${theme.id}`)
  const configBlobRes = await fetch(`${API}/repos/${cfg.owner}/${repoName}/git/blobs`, {
    method: 'POST',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: newConfigContent, encoding: 'utf-8' }),
  })
  await handle(configBlobRes)
  const configBlob = await configBlobRes.json()
  newTree.push({ path: '_config.yml', mode: '100644', type: 'blob', sha: configBlob.sha })

  // 4. 下载主题文件并在目标仓库创建 blob（限制并发数为 10，防止被 GitHub 封号）
  if (theme.repo) {
    const themeBranch = theme.branch || 'master'
    const treeRes = await fetch(
      `https://api.github.com/repos/${theme.repo}/git/trees/${themeBranch}?recursive=1`,
      { headers: headers(cfg.token) },
    )
    await handle(treeRes)
    const themeTree = (await treeRes.json()).tree as any[]
    const files = themeTree.filter(e => e.type === 'blob' && !e.path.startsWith('.'))

    // 并发下载与上传
    for (let i = 0; i < files.length; i += 10) {
      const chunk = files.slice(i, i + 10)
      await Promise.all(
        chunk.map(async (file: any) => {
          const blobRes = await fetch(`https://api.github.com/repos/${theme.repo}/git/blobs/${file.sha}`, { headers: headers(cfg.token) })
          const blob = await blobRes.json()
          
          const createBlobRes = await fetch(`${API}/repos/${cfg.owner}/${repoName}/git/blobs`, {
            method: 'POST',
            headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: blob.content, encoding: 'base64' }),
          })
          await handle(createBlobRes)
          const newBlob = await createBlobRes.json()
          
          newTree.push({
            path: `themes/${theme.id}/${file.path}`,
            mode: '100644',
            type: 'blob',
            sha: newBlob.sha,
          })
        })
      )
    }
  }

  // 5. 创建新的 Tree
  const createTreeRes = await fetch(`${API}/repos/${cfg.owner}/${repoName}/git/trees`, {
    method: 'POST',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: newTree }),
  })
  await handle(createTreeRes)
  const newTreeObj = await createTreeRes.json()

  // 6. 创建 Commit
  const createCommitRes = await fetch(`${API}/repos/${cfg.owner}/${repoName}/git/commits`, {
    method: 'POST',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `feat: 初始化主题 ${theme.id}`,
      tree: newTreeObj.sha,
      parents: [latestCommitSha],
    }),
  })
  await handle(createCommitRes)
  const newCommit = await createCommitRes.json()

  // 7. 更新分支的 Head 指向新的 Commit
  const updateRefRes = await fetch(`${API}/repos/${cfg.owner}/${repoName}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: newCommit.sha }),
  })
  await handle(updateRefRes)
  
  // 8. 生成独立主题配置文件 (如果有)
  if (theme.configFile) {
  }
}

export async function setupRepoAfterCreate(
  cfg: RepoConfig,
  repoName: string,
): Promise<void> {
  const repoCfg = { ...cfg, repo: repoName }

  // 1. 设置 Actions 权限为 Read and write（允许 workflow 自动推送到 main 分支）
  await fetch(`${API}/repos/${cfg.owner}/${repoName}/actions/permissions/workflow`, {
    method: 'PUT',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ default_workflow_permissions: 'write' }),
  })

  // 2. 开启 GitHub Pages（从 main 分支的根目录部署）
  await fetch(`${API}/repos/${cfg.owner}/${repoName}/pages`, {
    method: 'POST',
    headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: {
        branch: 'main',
        path: '/',
      },
    }),
  }).catch((e) => {
    console.warn('开启 Pages 失败，可能需要用户在后台手动开启', e)
  })
}

// 为了保证在刚创建仓库时，分支不报 404，我们需要等待分支生成
export async function waitForRepoReady(cfg: RepoConfig, repoName: string): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const url = `${API}/repos/${cfg.owner}/${repoName}/git/trees/${cfg.branch || 'dev'}`
    const res = await fetch(url, { headers: headers(cfg.token) })
    if (res.ok) return
    await new Promise((r) => setTimeout(r, 1500)) // 每次等 1.5 秒
  }
}