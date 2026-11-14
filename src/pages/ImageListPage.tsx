import { useEffect, useState } from 'react'
import type { RepoConfig } from '../types'
import { listImages, deleteFile, ImageItem } from '../lib/github'
import { useToast } from '../lib/toast'

interface Props {
  config: RepoConfig
  onBack: () => void
}

export default function ImageListPage({ config, onBack }: Props) {
  const toast = useToast()
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listImages(config)
      .then(list => !cancelled && setImages(list))
      .catch(e => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [config])

  // 1. 处理缩略图的代理加载（解决 raw 访问慢/失败）
  function getProxyUrl(url: string) {
    return url.replace('https://raw.githubusercontent.com', 'https://ghproxy.net/https://raw.githubusercontent.com')
  }

  // 2. 同步最新的路径拼接逻辑（使用 config.root）
  function getMarkdownLink(img: ImageItem) {
    const cleanRoot = config.root.endsWith('/') ? config.root.slice(0, -1) : config.root
    const cleanImgPrefix = config.imageUrlPrefix.startsWith('/') ? config.imageUrlPrefix.slice(1) : config.imageUrlPrefix
    const relPath = img.path.substring(config.imageDir.replace(/\/+$/, '').length)
    
    // 保证路径不会出现多余的斜杠
    const finalUrl = `${cleanRoot}/${cleanImgPrefix}${relPath}`
    return `![image](${finalUrl})`
  }

  async function handleCopy(img: ImageItem) {
    const text = getMarkdownLink(img)
    try {
      await navigator.clipboard.writeText(text)
      toast.show('已复制 Markdown 链接', 'success')
    } catch {
      window.prompt('复制失败，请手动复制：', text)
    }
  }

  async function handleDelete(img: ImageItem) {
    if (!window.confirm(`确定要删除图片 ${img.name} 吗？\n此操作会影响所有引用该图片的文章！`)) return
    setDeleting(img.path)
    try {
      await deleteFile(config, img.path, `delete image: ${img.path}`)
      setImages(prev => prev.filter(i => i.path !== img.path))
      toast.show('图片已删除', 'success')
    } catch (e: any) {
      toast.show(`删除失败：${e.message}`, 'error')
    } finally {
      setDeleting(null)
    }
  }

  const grouped = images.reduce((acc, img) => {
    if (!acc[img.folder]) acc[img.folder] = []
    acc[img.folder].push(img)
    return acc
  }, {} as Record<string, ImageItem[]>)

  return (
    <div className="page">
      <div className="content-col">
        <header className="page-header page-header--back">
          <button className="btn btn--icon" onClick={onBack}>←</button>
          <h1 className="page-title" style={{ flex: 1 }}>资源库</h1>
          <span className="badge">{images.length} 张</span>
        </header>

        {loading && <p className="text-secondary text-sm">正在扫描图片...</p>}
        {error && <div className="alert alert--error">{error}</div>}
        {!loading && !error && images.length === 0 && <div className="empty">没有找到图片</div>}

        {Object.entries(grouped).map(([folder, imgs]) => (
          <div key={folder} style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
              📁 {folder === '根目录' ? '根目录' : folder} ({imgs.length})
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--space-3)' }}>
              {imgs.map(img => (
                <div key={img.path} style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div onClick={() => handleCopy(img)} title="点击复制 Markdown 链接" style={{ height: 100, background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                    {/* 👇 这里换成了代理 URL */}
                    <img 
                      src={getProxyUrl(img.url)} 
                      alt={img.name} 
                      loading="lazy" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={img.name}>
                      {img.name}
                    </span>
                    <button onClick={() => handleDelete(img)} disabled={deleting === img.path} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2, fontSize: 12 }} title="删除图片">
                      {deleting === img.path ? '…' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}