import { useState } from 'react'
import type { RepoConfig } from '../types'
import { createBlogFromTemplate, installTheme } from '../lib/github'
import { THEME_MARKET, ThemeOption } from '../data/themes'
import { useToast } from '../lib/toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

interface Props {
  config: RepoConfig
  onBack: () => void
  onCreated: (newRepoName: string) => void
}

export default function CreateRepoPage({ config, onBack, onCreated }: Props) {
  const toast = useToast()
  const [repoName, setRepoName] = useState('my-blog')
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(THEME_MARKET[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!repoName.trim()) return setError('请输入仓库名称')
    const safeName = repoName.trim().replace(/[^a-zA-Z0-9_-]/g, '-')

    setLoading(true)
    setError(null)
    try {
      toast.show('正在创建仓库…', 'info')
      await createBlogFromTemplate(config, safeName)

      if (selectedTheme.id !== 'landscape') {
        toast.show(`正在安装主题 ${selectedTheme.name}…`, 'info')
        await installTheme(config, safeName, selectedTheme)
      }

      toast.show('建站成功！', 'success')
      onCreated(safeName)
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
          <h2 style={{ fontSize: 18, margin: '0 0 var(--space-2)' }}>创建新的 Hexo 博客</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-4)' }}>
            基于 <code>{config.owner}/blog-template</code> 生成仓库，并自动安装你选择的主题。
          </p>

          <div className="field">
            <label className="field__label">新仓库名称</label>
            <input className="input" value={repoName} onChange={e => setRepoName(e.target.value)} />
          </div>

          <div className="field">
            <label className="field__label">选择主题</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {THEME_MARKET.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

          {error && <div className="alert alert--error">{error}</div>}

          <button className="btn btn--primary" onClick={handleCreate} disabled={loading} style={{ width: '100%' }}>
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ marginRight: 6 }} />
            {loading ? '生成中…' : '开始生成'}
          </button>
        </div>
      </div>
    </div>
  )
}