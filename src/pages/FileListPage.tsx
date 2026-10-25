import { useEffect, useState } from 'react'
import type { RepoConfig, FileItem } from '../types'
import { listMdFiles } from '../lib/github'
import { listDrafts } from '../lib/draft'

interface Props {
  config: RepoConfig
  onOpenSettings: () => void
  onOpenDrafts: () => void
  onOpenFile: (path: string, isNew?: boolean) => void
}

export default function FileListPage({
  config,
  onOpenSettings,
  onOpenDrafts,
  onOpenFile,
}: Props) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [draftCount, setDraftCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    return () => {
      cancelled = true
    }
  }, [config])

  function handleNew() {
    const name = window.prompt('文件名（不含 .md 扩展名）')
    if (!name?.trim()) return
    const safe = name.trim().replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '-')
    onOpenFile(`${config.postsPath.replace(/\/+$/, '')}/${safe}.md`, true)
  }

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 8,
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>文章列表</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleNew} style={btn('#43a047')}>新建</button>
          <button onClick={onOpenDrafts} style={btn('#fb8c00')}>
            草稿箱{draftCount > 0 ? ` (${draftCount})` : ''}
          </button>
          <button onClick={onOpenSettings} style={btn('#f0f0f0', '#333')}>设置</button>
        </div>
      </div>

      <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
        {config.owner}/{config.repo} @ {config.branch}
      </p>

      {loading && <p>加载中…</p>}

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: '#ffebee',
            color: '#c62828',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <p style={{ color: '#999' }}>没有找到 .md 文件</p>
      )}

      {files.map(f => (
        <button
          key={f.path}
          onClick={() => onOpenFile(f.path)}
          style={{
            display: 'block',
            width: '100%',
            padding: 12,
            marginBottom: 6,
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            fontSize: 15,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          {f.name}
        </button>
      ))}
    </div>
  )
}

function btn(bg: string, color = '#fff'): React.CSSProperties {
  return {
    padding: '8px 12px',
    background: bg,
    color,
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  }
}