import { useState } from 'react'
import type { RepoConfig } from '../types'
import { createBlogFromTemplate, installTheme, setupRepoAfterCreate, waitForRepoReady } from '../lib/github'
import { THEME_MARKET, ThemeOption } from '../data/themes'
import { useToast } from '../lib/toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faArrowLeft, faCode } from '@fortawesome/free-solid-svg-icons'

interface Props {
  initial: RepoConfig | null
  onBack: () => void
  onCreated: (newConfig: RepoConfig) => void
}

export default function CreateRepoPage({ initial, onBack, onCreated }: Props) {
  const toast = useToast()
  
  const [owner, setOwner] = useState(initial?.owner || '')
  const [token, setToken] = useState(initial?.token || '')
  const [repoName, setRepoName] = useState(initial?.repo || 'my-blog')
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(THEME_MARKET[1]) // 默认选 Butterfly
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 👇 开发者选项开关
  const [isDevMode, setIsDevMode] = useState(false)

  async function handleCreate() {
    if (!owner.trim() || !token.trim() || !repoName.trim()) {
      setError('请填写完整信息')
      return
    }
    const safeName = repoName.trim().replace(/[^a-zA-Z0-9_-]/g, '-')

    setLoading(true)
    setError(null)
    try {
      const tmpConfig: RepoConfig = {
        ...(initial || {}),
        owner: owner.trim(),
        token: token.trim(),
        repo: safeName,
        branch: 'dev',
        root: '/',
        postsPath: 'source/_posts',
        imageDir: 'source/images',
        imageUrlPrefix: '/img',
        pagesBaseUrl: `https://${owner.trim()}.github.io`,
      } as RepoConfig

      if (!isDevMode) {
        // 正常流程：新建仓库
        toast.show('正在创建仓库…', 'info')
        await createBlogFromTemplate(tmpConfig, safeName)
        toast.show('等待仓库初始化…', 'info')
        await waitForRepoReady(tmpConfig, safeName)
      } else {
        // 开发者流程：跳过新建，直接等待现有仓库就绪
        toast.show('开发者模式：直接覆盖现有仓库…', 'info')
        await waitForRepoReady(tmpConfig, safeName)
      }

      // 1. 安装主题 (Git Tree API 会直接覆盖现有文件)
      if (selectedTheme.id !== 'landscape') {
        toast.show(`正在写入主题 ${selectedTheme.name}…`, 'info')
        await installTheme(tmpConfig, safeName, selectedTheme)
      }

      // 2. 配置 Pages 和权限
      toast.show('正在配置 Pages…', 'info')
      await setupRepoAfterCreate(tmpConfig, safeName)

      toast.show('操作成功！', 'success')
      onCreated(tmpConfig)
    } catch (e: any) {
      setError(e.message)
      toast.show(`失败：${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="content-col">
        <header className="page-header page-header--back">
          <button className="btn btn--icon btn--ghost" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="page-title" style={{ flex: 1 }}>一键建站</h1>
        </header>

        <div className="card">
          <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-4)' }}>
            基于模板生成新仓库，并自动配置主题与 Pages。
          </p>

          <div className="field">
            <label className="field__label">GitHub 用户名</label>
            <input className="input" value={owner} onChange={e => setOwner(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">PAT</label>
            <input className="input" type="password" value={token} onChange={e => setToken(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">目标仓库名称</label>
            <input className="input" value={repoName} onChange={e => setRepoName(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">选择主题</label>
            <select 
              className="input" 
              value={selectedTheme.id} 
              onChange={e => setSelectedTheme(THEME_MARKET.find(t => t.id === e.target.value)!)}
            >
              {THEME_MARKET.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* 👇 开发者选项折叠面板 */}
          <details style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', outline: 'none' }}>
              <FontAwesomeIcon icon={faCode} /> 开发者选项
            </summary>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={isDevMode} onChange={e => setIsDevMode(e.target.checked)} />
                不新建仓库，直接覆盖现有的目标仓库
              </label>
            </div>
          </details>

          {error && <div className="alert alert--error" style={{ marginTop: 'var(--space-4)' }}>{error}</div>}

          <button className="btn btn--primary" onClick={handleCreate} disabled={loading} style={{ width: '100%', marginTop: 'var(--space-4)' }}>
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ marginRight: 6 }} />
            {loading ? '处理中…' : isDevMode ? '覆盖并初始化' : '开始生成'}
          </button>
        </div>
      </div>
    </div>
  )
}