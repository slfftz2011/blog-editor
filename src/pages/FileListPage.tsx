import { useEffect, useState } from 'react'
import type { RepoConfig, FileItem } from '../types'
import { listMdFiles, deleteFile } from '../lib/github'
import { listDrafts } from '../lib/draft'
import { useToast } from '../lib/toast'

interface Props {
  config: RepoConfig
  onOpenSettings: () => void
  onOpenDrafts: () => void
  onOpenHelp: () => void
  onOpenAbout: () => void
  onOpenFile: (path: string, isNew?: boolean) => void
}

export default function FileListPage({
  config, onOpenSettings, onOpenDrafts, onOpenHelp, onOpenAbout, onOpenFile,
}: Props) {
  const toast = useToast()
  const [files, setFiles] = useState<FileItem[]>([])
  const [draftCount, setDraftCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    setDraftCount(listDrafts().length)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listMdFiles(config)
      .then(list => !cancelled && setFiles(list))
      .catch(e => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [config])

  function handleNew() {
    const name = window.prompt('文件名（不含 .md 扩展名）')
    if (!name?.trim()) return
    const safe = name.trim().replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '-')
    onOpenFile(`${config.postsPath.replace(/\/+$/, '')}/${safe}.md`, true)
  }

  async function handleDelete(f: FileItem) {
    if (!window.confirm(`确定要删除《${f.name}》吗？此操作无法撤销。`)) return
    setDeleting(f.path)
    try {
      await deleteFile(config, f.path, `delete post: ${f.path}`)
      setFiles(prev => prev.filter(item => item.path !== f.path))
      toast.show('文章已删除', 'success')
    } catch (e: any) {
      toast.show(`删除失败：${e.message}`, 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="page">
      <div className="content-col">
        <header className="page-header">
          <div>
            <h1 className="page-title">文章列表</h1>
            <p className="page-subtitle">
              {config.owner}/{config.repo} @ {config.branch}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn--primary" onClick={handleNew}>新建</button>
            <button className="btn btn--outline" onClick={onOpenDrafts}>
              草稿箱{draftCount > 0 && <span className="badge badge--accent">{draftCount}</span>}
            </button>
            <br></br>
            <button className="btn btn--ghost" onClick={onOpenSettings}>设置</button>
            <button className="btn btn--ghost" onClick={onOpenHelp}>帮助</button>
            <button className="btn btn--ghost" onClick={onOpenAbout}>关于</button>
          </div>
        </header>

        {loading && <p className="text-secondary text-sm">加载中…</p>}

        {error && <div className="alert alert--error">{error}</div>}

        {!loading && !error && files.length === 0 && (
          <div className="empty">没有找到 .md 文件</div>
        )}

        {files.length > 0 && (
          <ul className="list">
            {files.map(f => (
              <li key={f.path} className="list-item">
                <button className="list-item__main" onClick={() => onOpenFile(f.path)}>
                  <div className="list-row__title">{f.name}</div>
                </button>
                <button
                  className="btn btn--icon btn--danger-ghost"
                  onClick={() => handleDelete(f)}
                  disabled={deleting === f.path}
                  aria-label="删除"
                  title="删除"
                >
                  {deleting === f.path ? '…' : '✕'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}