import { useState } from 'react'
import { openExternal } from '../lib/external'
import { checkUpdate, UpdateInfo } from '../lib/updater'

interface Props {
  onBack: () => void
}

export default function AboutPage({ onBack }: Props) {
  const [checking, setChecking] = useState(false)
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheck() {
    setChecking(true)
    setError(null)
    setMessage(null)
    setUpdate(null)
    try {
      const info = await checkUpdate(__APP_VERSION__)
      if (info) setUpdate(info)
      else setMessage('已是最新版本')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="page">
      <div className="content-col">
        <header className="page-header--back">
          <h1 className="page-title">关于</h1>
          <button className="btn btn--ghost" onClick={onBack}>返回</button>
        </header>

        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 var(--space-1)' }}>
            BlogEditor
          </h2>
          <p className="text-secondary text-sm" style={{ margin: '0 0 var(--space-4)' }}>
            移动端 Hexo 博客编辑器
          </p>

          <Row label="当前版本" value={__APP_VERSION__} />
          <Row
            label="构建平台"
            value={
              navigator.userAgent.includes('wv') ||
              /Android/i.test(navigator.userAgent)
                ? 'Android / WebView'
                : 'Web'
            }
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <button className="btn btn--primary" onClick={handleCheck} disabled={checking}>
              {checking ? '检查中…' : '检查更新'}
            </button>
            <button
              className="btn btn--outline"
              onClick={() => openExternal('https://github.com/slfftz2011/blog-editor')}
            >
              源代码
            </button>
            <button
              className="btn btn--outline"
              onClick={() => openExternal('https://github.com/slfftz2011/blog-editor/releases')}
            >
              版本历史
            </button>
          </div>

          {message && (
            <div className="alert alert--success" style={{ marginTop: 'var(--space-3)', marginBottom: 0 }}>
              {message}
            </div>
          )}

          {error && (
            <div className="alert alert--error" style={{ marginTop: 'var(--space-3)', marginBottom: 0 }}>
              {error}
            </div>
          )}

          {update && (
            <div className="update-panel">
              <div className="update-panel__title">发现新版本 {update.version}</div>
              <div className="update-panel__meta">
                发布于 {new Date(update.publishedAt).toLocaleString()}
              </div>
              {update.notes && <pre className="code-block">{update.notes}</pre>}
              <div className="update-panel__actions">
                {update.apkUrl && (
                  <button className="btn btn--primary" onClick={() => openExternal(update.apkUrl!)}>
                    下载 APK
                  </button>
                )}
                <button className="btn btn--outline" onClick={() => openExternal(update.url)}>
                  查看 Release
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 var(--space-2)' }}>
            技术栈
          </h3>
          <p className="text-secondary text-sm" style={{ margin: 0, lineHeight: 1.6 }}>
            React 18 · TypeScript · Vite 6 · CodeMirror 6 · markdown-it · Capacitor 6
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="kv-row">
      <span className="kv-row__label">{label}</span>
      <span className="kv-row__value">{value}</span>
    </div>
  )
}