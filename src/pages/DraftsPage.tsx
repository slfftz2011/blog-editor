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
    <div className="page">
      <div className="content-col">
        <header className="page-header--back">
          <h1 className="page-title">草稿箱</h1>
          <button className="btn btn--ghost" onClick={onBack}>返回</button>
          <span className="text-secondary text-sm">{drafts.length} 篇</span>
        </header>

        {drafts.length === 0 && <div className="empty">暂无草稿</div>}

        {drafts.map(d => {
          const fileName = d.path.split('/').pop() || d.path
          const remaining = d.expiresAt - Date.now()
          const remainingDays = Math.ceil(remaining / (24 * 60 * 60 * 1000))
          const expiringSoon = remainingDays <= 1

          return (
            <div key={d.path} className="card">
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <div className="list-row__title">
                  {fileName}
                  {d.isNew && <span className="badge badge--accent">新建</span>}
                </div>
                <div className="text-tertiary text-xs" style={{ marginTop: 2, wordBreak: 'break-all' }}>
                  {d.path}
                </div>
              </div>

              <div className="text-secondary text-xs" style={{ marginBottom: 'var(--space-3)' }}>
                编辑于 {formatAbsolute(d.savedAt)}（{formatRelative(d.savedAt)}）
                <span
                  className={expiringSoon ? 'text-danger' : 'text-tertiary'}
                  style={{ marginLeft: 10 }}
                >
                  {remainingDays} 天后过期
                </span>
              </div>

              {confirmPath === d.path ? (
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="text-danger text-sm" style={{ flex: 1, minWidth: 160 }}>
                    确认丢弃这篇草稿？不可恢复
                  </span>
                  <button className="btn btn--danger" onClick={() => handleDiscard(d.path)}>
                    确认丢弃
                  </button>
                  <button className="btn btn--outline" onClick={() => setConfirmPath(null)}>
                    取消
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn--primary" onClick={() => onRestore(d.path, d.isNew)}>
                    恢复
                  </button>
                  <button className="btn btn--outline" onClick={() => setConfirmPath(d.path)}>
                    丢弃
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
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