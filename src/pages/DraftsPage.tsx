import { useEffect, useState } from 'react'
import { listDrafts, clearDraft, DraftItem } from '../lib/draft'

interface Props {
  onBack: () => void
  onRestore: (path: string, isNew: boolean) => void
}

export default function DraftsPage({ onBack, onRestore }: Props) {
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [confirmPath, setConfirmPath] = useState<string | null>(null)

  function refresh() {
    setDrafts(listDrafts())
  }

  useEffect(() => {
    refresh()
  }, [])

  function handleDiscard(path: string) {
    clearDraft(path)
    setConfirmPath(null)
    refresh()
  }

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={onBack} style={btn('#757575')}>返回</button>
        <h1 style={{ fontSize: 22, margin: 0, flex: 1 }}>草稿箱</h1>
        <span style={{ fontSize: 13, color: '#666' }}>{drafts.length} 篇</span>
      </div>

      {drafts.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>
          暂无草稿
        </p>
      )}

      {drafts.map(d => {
        const fileName = d.path.split('/').pop() || d.path
        const remaining = d.expiresAt - Date.now()
        const remainingDays = Math.ceil(remaining / (24 * 60 * 60 * 1000))
        const expiringSoon = remainingDays <= 1

        return (
          <div
            key={d.path}
            style={{
              padding: 12,
              marginBottom: 8,
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, wordBreak: 'break-all' }}>
                  {fileName}
                  {d.isNew && (
                    <span style={badge('#e3f2fd', '#1565c0')}>新建</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2, wordBreak: 'break-all' }}>
                  {d.path}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
              编辑于 {formatAbsolute(d.savedAt)}（{formatRelative(d.savedAt)}）
              <span
                style={{
                  marginLeft: 10,
                  color: expiringSoon ? '#c62828' : '#9e9e9e',
                }}
              >
                {remainingDays} 天后过期
              </span>
            </div>

            {confirmPath === d.path ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13, color: '#c62828', alignSelf: 'center' }}>
                  确认丢弃这篇草稿？不可恢复
                </span>
                <button onClick={() => handleDiscard(d.path)} style={btn('#c62828')}>
                  确认丢弃
                </button>
                <button onClick={() => setConfirmPath(null)} style={btn('#e0e0e0', '#333')}>
                  取消
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onRestore(d.path, d.isNew)}
                  style={btn('#43a047')}
                >
                  恢复
                </button>
                <button
                  onClick={() => setConfirmPath(d.path)}
                  style={btn('#e0e0e0', '#333')}
                >
                  丢弃
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatAbsolute(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

function badge(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    marginLeft: 6,
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 11,
    background: bg,
    color,
    verticalAlign: 'middle',
  }
}

function btn(bg: string, color = '#fff'): React.CSSProperties {
  return {
    padding: '8px 12px',
    background: bg,
    color,
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  }
}