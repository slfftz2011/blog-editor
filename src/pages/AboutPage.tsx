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
      if (info) {
        setUpdate(info)
      } else {
        setMessage('已是最新版本')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={onBack} style={btn('#757575')}>返回</button>
        <h1 style={{ fontSize: 22, margin: 0, flex: 1 }}>关于</h1>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>BlogEditor</h2>
        <p style={{ color: '#666', fontSize: 13, margin: '0 0 12px' }}>
          移动端 Hexo 博客编辑器
        </p>

        <Row label="当前版本" value={__APP_VERSION__} />
        <Row label="构建平台" value={navigator.userAgent.includes('wv') || /Android/i.test(navigator.userAgent) ? 'Android / WebView' : 'Web'} />

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={handleCheck} disabled={checking} style={btn('#1976d2')}>
            {checking ? '检查中…' : '检查更新'}
          </button>
          // 源代码
          <button
            onClick={() => openExternal('https://github.com/slfftz2011/blog-editor')}
            style={btn('#f0f0f0', '#333')}
          >
            源代码
          </button>

          // 版本历史
          <button
            onClick={() => openExternal('https://github.com/slfftz2011/blog-editor/releases')}
            style={btn('#f0f0f0', '#333')}
          >
            版本历史
          </button>
        </div>

        {message && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: '#e8f5e9', color: '#2e7d32', fontSize: 13 }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: '#ffebee', color: '#c62828', fontSize: 13 }}>
            {error}
          </div>
        )}

        {update && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#e3f2fd', border: '1px solid #90caf9' }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
              发现新版本 {update.version}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
              发布于 {new Date(update.publishedAt).toLocaleString()}
            </div>
            {update.notes && (
              <pre style={{
                fontSize: 12,
                background: '#fff',
                padding: 8,
                borderRadius: 6,
                maxHeight: 160,
                overflow: 'auto',
                margin: '0 0 10px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {update.notes}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            // 下载 APK（在更新卡片里）
            {update.apkUrl && (
              <button
                onClick={() => openExternal(update.apkUrl!)}
                style={btn('#43a047')}
              >
                下载 APK
              </button>
            )}

            // 查看 Release（在更新卡片里）
            <button
              onClick={() => openExternal(update.url)}
              style={btn('#f0f0f0', '#333')}
            >
              查看 Release
            </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>技术栈</h3>
        <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>
          React 18 · TypeScript · Vite 6 · CodeMirror 6 · markdown-it · Capacitor 6
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{value}</span>
    </div>
  )
}

const card: React.CSSProperties = {
  padding: 16,
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #e0e0e0',
}

function btn(bg: string, color = '#fff'): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: bg,
    color,
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  }
}