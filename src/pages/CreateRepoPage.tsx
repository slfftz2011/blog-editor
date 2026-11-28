import { useState } from 'react'
import type { RepoConfig } from '../types'
import { createBlogFromTemplate, installTheme, setupRepoAfterCreate, waitForRepoReady } from '../lib/github'
import { THEME_MARKET, ThemeOption } from '../data/themes'
import { useToast } from '../lib/toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

interface Props {
  initial: RepoConfig | null
  onBack: () => void
  onCreated: (newConfig: RepoConfig) => void
}

export default function CreateRepoPage({ initial, onBack, onCreated }: Props) {
  const toast = useToast()
  
  // 允许用户在这里输入凭证
  const [owner, setOwner] = useState(initial?.owner || '')
  const [token, setToken] = useState(initial?.token || '')
  
  const [repoName, setRepoName] = useState('my-blog')
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(THEME_MARKET[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!owner.trim() || !token.trim()) {
      setError('请先填写 GitHub 用户名和 PAT')
      return
    }
    if (!repoName.trim()) {
      setError('请输入新仓库的名称')
      return
    }
    const safeName = repoName.trim().replace(/[^a-zA-Z0-9_-]/g, '-')

    setLoading(true)
    setError(null)
    try {
      // 用表单里的凭证构建一个临时配置
      const tmpConfig: RepoConfig = {
        ...(initial || {}),
        owner: owner.trim(),
        token: token.trim(),
        repo: safeName,
        branch: 'dev', // 模板默认生成 dev
        root: '/',
        postsPath: 'source/_posts',
        imageDir: 'source/images',
        imageUrlPrefix: '/img',
        pagesBaseUrl: `https://${owner.trim()}.github.io`,
      } as RepoConfig

      toast.show('正在创建仓库…', 'info')
      await createBlogFromTemplate(tmpConfig, safeName)

      // 👇 关键新增：等待仓库底层的分支同步就绪
      toast.show('等待仓库初始化…', 'info')
      await waitForRepoReady(tmpConfig, safeName)

      // 👇 关键新增：自动配置 Actions 和 Pages
      toast.show('正在配置 Pages 与权限…', 'info')
      await setupRepoAfterCreate(tmpConfig, safeName)

      if (selectedTheme.id !== 'landscape') {
        toast.show(`正在安装主题 ${selectedTheme.name}…`, 'info')
        await installTheme(tmpConfig, safeName, selectedTheme)
      }

      toast.show('建站成功！', 'success')
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
          <h1 className="page-title" style={{ flex: 1 }}>一键建站向导</h1>
        </header>

        <div className="card">
          <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
            基于纯净的 <code>blog-template</code> 生成新仓库，并自动安装你喜欢的主题，免去繁琐的本地配置。
          </p>

          <div className="field">
            <label className="field__label">GitHub 用户名</label>
            <input className="input" value={owner} onChange={e => setOwner(e.target.value)} placeholder="例如 slfftz2011" />
          </div>

          <div className="field">
            <label className="field__label">Personal Access Token (PAT)</label>
            <input className="input" type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="需包含 Administration 权限" />
            <p className="field__hint">由于要创建新仓库，PAT 必须拥有 <b>Administration</b> 的 Read and write 权限。</p>
          </div>

          <div className="field">
            <label className="field__label">新仓库名称</label>
            <input className="input" value={repoName} onChange={e => setRepoName(e.target.value)} />
          </div>

          <div className="field">
            <label className="field__label">选择主题</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {THEME_MARKET.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <input
                    type="radio"
                    name="theme"
                    checked={selectedTheme.id === t.id}
                    onChange={() => setSelectedTheme(t)}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>

          {error && <div className="alert alert--error" style={{ marginTop: 'var(--space-3)' }}>{error}</div>}

          <button className="btn btn--primary" onClick={handleCreate} disabled={loading} style={{ width: '100%', marginTop: 'var(--space-4)' }}>
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ marginRight: 6 }} />
            {loading ? '正在建站，请稍候…' : '开始生成'}
          </button>
        </div>
      </div>
    </div>
  )
}