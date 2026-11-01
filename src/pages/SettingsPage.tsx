import { useState } from 'react'
import type { RepoConfig } from '../types'
import { saveConfig, defaultConfig } from '../lib/storage'
import { testConnection } from '../lib/github'
import { useTheme } from '../lib/theme'

interface Props {
  initial: RepoConfig | null
  onSaved: (cfg: RepoConfig) => void
  onCancel?: () => void
  onHelp?: () => void
}

export default function SettingsPage({ initial, onSaved, onCancel, onHelp }: Props) {
  const [cfg, setCfg] = useState<RepoConfig>(initial ?? defaultConfig)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [theme, setTheme] = useTheme()

  const set = <K extends keyof RepoConfig>(k: K, v: RepoConfig[K]) =>
    setCfg(prev => ({ ...prev, [k]: v }))

  async function handleTest() {
    setTesting(true)
    setResult(null)
    try {
      setResult({ ok: true, msg: await testConnection(cfg) })
    } catch (e: any) {
      setResult({ ok: false, msg: e.message })
    } finally {
      setTesting(false)
    }
  }

  function handleSave() {
    if (!cfg.token.trim()) {
      setResult({ ok: false, msg: 'PAT 不能为空' })
      return
    }
    saveConfig(cfg)
    onSaved(cfg)
  }

  return (
    <div className="settings-page">
      <div className="content-col">
        <header className="settings-header">
          <h1 className="settings-title">仓库配置</h1>
          {onHelp && (
            <button className="btn btn--ghost" onClick={onHelp}>
              📖 使用教程
            </button>
          )}
        </header>

        {/* 外观 */}
        <section className="settings-group">
          <div className="settings-group__label">外观</div>
          <div className="settings-row">
            <div>
              <div style={{ fontWeight: 500 }}>主题</div>
              <div className="settings-row__hint">选择界面配色方案</div>
            </div>
            <div className="segmented" role="group" aria-label="主题">
              <button
                type="button"
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                浅色
              </button>
              <button
                type="button"
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                深色
              </button>
              <button
                type="button"
                aria-pressed={theme === 'system'}
                onClick={() => setTheme('system')}
              >
                跟随系统
              </button>
            </div>
          </div>
        </section>

        {/* 仓库信息 */}
        <section className="settings-group">
          <div className="settings-group__label">仓库信息</div>
          <p className="field__hint" style={{ marginBottom: 'var(--space-4)' }}>
            PAT 仅保存在本机浏览器 localStorage，建议使用 fine-grained token，
            只授权博客仓库的 Contents: Read and write 权限。
          </p>
          <Field label="Owner" value={cfg.owner} onChange={v => set('owner', v)} />
          <Field label="仓库名" value={cfg.repo} onChange={v => set('repo', v)} />
          <Field label="分支" value={cfg.branch} onChange={v => set('branch', v)} />
          <Field
            label="PAT"
            type="password"
            value={cfg.token}
            onChange={v => set('token', v)}
            hint="存储在本地，不会上传到任何服务器"
          />
        </section>

        {/* 路径与 URL */}
        <section className="settings-group">
          <div className="settings-group__label">路径与 URL</div>
          <Field
            label="文章目录"
            value={cfg.postsPath}
            onChange={v => set('postsPath', v)}
          />
          <Field
            label="图片目录"
            value={cfg.imageDir}
            onChange={v => set('imageDir', v)}
          />
          <Field
            label="图片 URL 前缀"
            value={cfg.imageUrlPrefix}
            onChange={v => set('imageUrlPrefix', v)}
          />
          <Field
            label="Pages 地址（可选，留空则直接用 raw）"
            value={cfg.pagesBaseUrl}
            onChange={v => set('pagesBaseUrl', v)}
            hint="格式：https://用户名.github.io/仓库名"
          />
        </section>

        {result && (
          <div className={`alert ${result.ok ? 'alert--success' : 'alert--error'}`}>
            {result.msg}
          </div>
        )}

        <div className="settings-actions">
          <button className="btn btn--primary" onClick={handleSave}>
            保存并进入
          </button>
          <button className="btn btn--outline" onClick={handleTest} disabled={testing}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          {onCancel && (
            <button className="btn btn--ghost" onClick={onCancel}>
              取消
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  hint?: string
}) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <input
        className="input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  )
}