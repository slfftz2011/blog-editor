import { useEffect, useState } from 'react'
import type { RepoConfig, FileItem } from '../types'
import { listMdFiles, deleteFile, renameFile } from '../lib/github'
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
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
    const name = window.prompt('文件名（支持包含 . 号）')
    if (!name?.trim()) return
    // 修复：只过滤系统非法字符，保留点号
    const safe = name.trim().replace(/[\\/:*?"<>|]/g, '-')
    // 自动兼容 .md 后缀
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
      
      setFiles(prev => prev.map(item => 
        item.path === oldPath ? { path: newPath, name: newFileName } : item
      ))
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
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>文章列表</h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleNew} style={btn('#43a047')}>新建</button>
          <button onClick={onOpenDrafts} style={btn('#fb8c00')}>
            草稿箱{draftCount > 0 ? ` (${draftCount})` : ''}
          </button>
          <button onClick={onOpenSettings} style={btn('#f0f0f0', '#333')}>设置</button>
          <button onClick={onOpenHelp} style={btn('#f0f0f0', '#333')}>帮助</button>
          <button onClick={onOpenAbout} style={btn('#f0f0f0', '#333')}>关于</button>
        </div>
      </div>

      <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
        {config.owner}/{config.repo} @ {config.branch}
      </p>

      {loading && <p>加载中…</p>}
      {error && <div style={{ padding: 12, borderRadius: 8, background: '#ffebee', color: '#c62828', fontSize: 14 }}>{error}</div>}
      {!loading && !error && files.length === 0 && <p style={{ color: '#999' }}>没有找到 .md 文件</p>}

      {files.map(f => (
        <div key={f.path} style={{ display: 'flex', alignItems: 'stretch', marginBottom: 6, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => onOpenFile(f.path)}
            style={{ flex: 1, padding: 12, fontSize: 15, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {f.name}
          </button>
          <button
            onClick={() => handleRename(f)}
            disabled={actionLoading === f.path}
            style={{
              padding: '0 12px', background: '#f5f5f5', color: '#333',
              border: 'none', borderLeft: '1px solid #e0e0e0',
              cursor: actionLoading === f.path ? 'not-allowed' : 'pointer', fontSize: 13,
            }}
          >
            改名
          </button>
          <button
            onClick={() => handleDelete(f)}
            disabled={actionLoading === f.path}
            style={{
              padding: '0 16px', background: actionLoading === f.path ? '#ffcdd2' : '#ffebee',
              color: '#c62828', border: 'none', borderLeft: '1px solid #e0e0e0',
              cursor: actionLoading === f.path ? 'not-allowed' : 'pointer', fontSize: 13,
            }}
          >
            {actionLoading === f.path ? '...' : '删除'}
          </button>
        </div>
      ))}
    </div>
  )
}

function btn(bg: string, color = '#fff'): React.CSSProperties {
  return {
    padding: '8px 12px', background: bg, color,
    border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
  }
}