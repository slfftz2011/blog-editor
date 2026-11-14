import { useState } from 'react'
import type { RepoConfig } from '../types'
import { saveConfig, defaultConfig } from '../lib/storage'
import { testConnection, fetchHexoRoot } from '../lib/github'
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
  const [fetchingConfig, setFetchingConfig] = useState(false)
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

  async function handleAutoFetch() {
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      setResult({ ok: false, msg: '请先填写仓库所有者、名称和 PAT' })
      return
    }
    setFetchingConfig(true)
    setResult(null)
    try {
      const root = await fetchHexoRoot(cfg)
      setCfg(prev => ({ ...prev, root }))
      setResult({ ok: true, msg: `成功读取配置，Root 路径为: ${root}` })
    } catch (e: any) {
      setResult({ ok: false, msg: `读取失败：${e.message}` })
    } finally {
      setFetchingConfig(false)
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
          {onHelp && <button className="btn btn--ghost" onClick={onHelp}>📖 使用教程</button>}
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

        {/* 1. 基础信息 */}
        <section className="settings-group">
          <div className="settings-group__label">基础信息</div>
          <p className="field__hint" style={{ marginBottom: 'var(--space-4)' }}>
            请先填写仓库基本信息，点击下方按钮可自动读取 _config.yml 补全路径。
          </p>
          <Field label="Owner" value={cfg.owner} onChange={v => set('owner', v)} />
          <Field label="仓库名" value={cfg.repo} onChange={v => set('repo', v)} />
          <Field label="分支" value={cfg.branch} onChange={v => set('branch', v)} />
          <Field label="PAT" type="password" value={cfg.token} onChange={v => set('token', v)} />
          <Field label="博客域名" value={cfg.pagesBaseUrl} onChange={v => set('pagesBaseUrl', v)} hint="例如 https://username.github.io" />
        </section>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <button className="btn btn--primary" onClick={handleAutoFetch} disabled={fetchingConfig} style={{ width: '100%' }}>
            {fetchingConfig ? '正在读取配置…' : '⚡ 自动读取 _config.yml 补全路径'}
          </button>
        </div>

        {/* 2. 路径与 URL */}
        <section className="settings-group">
          <div className="settings-group__label">高级路径配置</div>
          <Field label="文章目录" value={cfg.postsPath} onChange={v => set('postsPath', v)} />
          <Field label="图片目录" value={cfg.imageDir} onChange={v => set('imageDir', v)} />
          <Field label="图片 URL 前缀" value={cfg.imageUrlPrefix} onChange={v => set('imageUrlPrefix', v)} hint="例如 /img" />
          <Field label="Root 路径" value={cfg.root} onChange={v => set('root', v)} hint="Hexo 部署路径，例如 /blog/ 或 /" />
        </section>

        {result && <div className={`alert ${result.ok ? 'alert--success' : 'alert--error'}`}>{result.msg}</div>}

        <div className="settings-actions">
          <button className="btn btn--primary" onClick={handleSave}>保存并进入</button>
          <button className="btn btn--outline" onClick={handleTest} disabled={testing}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          {onCancel && <button className="btn btn--ghost" onClick={onCancel}>取消</button>}
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