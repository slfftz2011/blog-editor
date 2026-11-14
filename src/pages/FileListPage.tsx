import { useEffect, useState } from 'react'
import type { RepoConfig, FileItem } from '../types'
import { listMdFiles, deleteFile, renameFile } from '../lib/github'
import { listDrafts } from '../lib/draft'
import { useToast } from '../lib/toast'

interface Props {
  config: RepoConfig
  onOpenSettings: () => void
  onOpenDrafts: () => void
  onOpenImages: () => void // 新增
  onOpenHelp: () => void
  onOpenAbout: () => void
  onOpenFile: (path: string, isNew?: boolean) => void
}

export default function FileListPage({
  config, onOpenSettings, onOpenDrafts, onOpenImages, onOpenHelp, onOpenAbout, onOpenFile,
}: Props) {
  const toast = useToast()
  const [files, setFiles] = useState<FileItem[]>([])
  const [draftCount, setDraftCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { setDraftCount(listDrafts().length) }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listMdFiles(config)
      .then(list => !cancelled && setFiles(list))
      .catch(e => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [config])

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  function handleNew() {
    const name = window.prompt('文件名（支持包含 . 号）')
    if (!name?.trim()) return
    const safe = name.trim().replace(/[\\/:*?"<>|]/g, '-')
    const fileName = safe.endsWith('.md') ? safe : `${safe}.md`
    onOpenFile(`${config.postsPath.replace(/\/+$/, '')}/${fileName}`, true)
  }

  async function handleRename(f: FileItem) {
    const baseName = f.name.endsWith('.md') ? f.name.slice(0, -3) : f.name
    const newName = window.prompt('输入新的文件名', baseName)
    if (!newName || newName.trim() === baseName) return
    const safe = newName.trim().replace(/[\\/:*?"<>|]/g, '-')
    const newFileName = safe.endsWith('.md') ? safe : `${safe}.md`
    if (newFileName === f.name) return
    
    setActionLoading(f.path)
    try {
      const oldPath = f.path
      const newPath = oldPath.replace(/[^/]+$/, newFileName)
      await renameFile(config, oldPath, newPath, `rename: ${f.name} -> ${newFileName}`)
      setFiles(prev => prev.map(item => item.path === oldPath ? { path: newPath, name: newFileName } : item))
      toast.show('文章已重命名', 'success')
    } catch (e: any) {
      toast.show(`重命名失败：${e.message}`, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(f: FileItem) {
    if (!window.confirm(`确定要删除《${f.name}》吗？此操作无法撤销。`)) return
    setActionLoading(f.path)
    try {
      await deleteFile(config, f.path, `delete post: ${f.path}`)
      setFiles(prev => prev.filter(item => item.path !== f.path))
      toast.show('文章已删除', 'success')
    } catch (e: any) {
      toast.show(`删除失败：${e.message}`, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="page">
      <div className="content-col">
        <header className="page-header">
          <div>
            <h1 className="page-title">文章列表</h1>
            <p className="page-subtitle">{config.owner}/{config.repo} @ {config.branch}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button className="btn btn--primary" onClick={handleNew}>新建</button>
            <button className="btn btn--outline" onClick={onOpenDrafts}>
              草稿箱{draftCount > 0 && <span className="badge badge--accent">{draftCount}</span>}
            </button>
            <button className="btn btn--outline" onClick={onOpenImages}>🖼️ 资源库</button>
            <button className="btn btn--ghost" onClick={onOpenSettings}>设置</button>
            <button className="btn btn--ghost" onClick={onOpenHelp}>帮助</button>
            <button className="btn btn--ghost" onClick={onOpenAbout}>关于</button>
          </div>
        </header>

        <div className="field" style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
          <input type="search" className="input" placeholder="搜索文章名称..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading && <p className="text-secondary text-sm">加载中…</p>}
        {error && <div className="alert alert--error">{error}</div>}
        {!loading && !error && filteredFiles.length === 0 && (
          <div className="empty">{search ? '没有匹配的文章' : '没有找到 .md 文件'}</div>
        )}

        {filteredFiles.length > 0 && (
          <ul className="list">
            {filteredFiles.map(f => (
              <li key={f.path} className="list-item">
                <button className="list-item__main" onClick={() => onOpenFile(f.path)}>
                  <div className="list-row__title">{f.name}</div>
                </button>
                <button className="btn btn--icon btn--ghost" onClick={() => handleRename(f)} disabled={actionLoading === f.path} aria-label="重命名">✏️</button>
                <button className="btn btn--icon btn--danger-ghost" onClick={() => handleDelete(f)} disabled={actionLoading === f.path} aria-label="删除">
                  {actionLoading === f.path ? '…' : '✕'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}