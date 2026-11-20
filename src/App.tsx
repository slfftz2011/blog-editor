import { useState, useEffect } from 'react'
import { loadConfig } from './lib/storage'
import type { RepoConfig } from './types'
import SettingsPage from './pages/SettingsPage'
import FileListPage from './pages/FileListPage'
import EditorPage from './pages/EditorPage'
import DraftsPage from './pages/DraftsPage'
import HelpPage from './pages/HelpPage'
import AboutPage from './pages/AboutPage'
import ImageListPage from './pages/ImageListPage'

type BackTo = 'files' | 'drafts'

type Page =
  | { name: 'settings' }
  | { name: 'files' }
  | { name: 'drafts' }
  | { name: 'images' }
  | { name: 'help'; from: 'files' | 'settings' }
  | { name: 'about' }
  | { name: 'editor'; path: string; isNew: boolean; backTo: BackTo }

export default function App() {
  const [initial] = useState<RepoConfig | null>(() => {
    const c = loadConfig()
    return c.token ? c : null
  })
  const [config, setConfig] = useState<RepoConfig | null>(initial)
  const [page, setPage] = useState<Page>(
    initial ? { name: 'files' } : { name: 'settings' },
  )
  const [refreshKey, setRefreshKey] = useState(0)

  // ========== 返回手势拦截逻辑 ==========
  useEffect(() => {
    // 如果不是首页，就压入一个历史记录
    if (page.name !== 'files' && page.name !== 'settings') {
      window.history.pushState({ page: page.name }, '')
    }

    const handlePopState = () => {
      // 用户触发了返回（按了返回键或者手势）
      if (page.name === 'files' || page.name === 'settings') {
        // 在首页了，允许退出
        return
      }
      
      // 阻止退出，并退回到文件列表
      if (page.name === 'editor') {
        // 如果是编辑器，退回原页面
        if (page.backTo === 'drafts') setPage({ name: 'drafts' })
        else setPage({ name: 'files' })
        setRefreshKey(k => k + 1)
      } else if (page.name === 'help') {
        setPage(page.from === 'settings' ? { name: 'settings' } : { name: 'files' })
      } else {
        // 其他二级页面（草稿箱、关于、资源库）统一回文件列表
        setPage({ name: 'files' })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [page])
  // =====================================

  function openEditor(path: string, isNew: boolean, backTo: BackTo) {
    setPage({ name: 'editor', path, isNew, backTo })
  }

  // 如果没有配置，或者当前在设置页
  if (!config || page.name === 'settings') {
    return (
      <div className="animate-fade-in">
        <SettingsPage
          initial={config}
          onSaved={cfg => {
            setConfig(cfg)
            setPage({ name: 'files' })
          }}
          onCancel={config ? () => setPage({ name: 'files' }) : undefined}
          onHelp={() => setPage({ name: 'help', from: 'settings' })}
        />
      </div>
    )
  }

  // 其他路由渲染 (包裹一层动画)
  return (
    <div className="animate-fade-in" key={page.name}>
      {page.name === 'editor' && (
        <EditorPage
          config={config}
          path={page.path}
          isNew={page.isNew}
          onBack={() => {
            if (page.backTo === 'drafts') setPage({ name: 'drafts' })
            else setPage({ name: 'files' })
            setRefreshKey(k => k + 1)
          }}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
      
      {page.name === 'drafts' && (
        <DraftsPage
          onBack={() => setPage({ name: 'files' })}
          onRestore={(path, isNew) => openEditor(path, isNew, 'drafts')}
        />
      )}

      {page.name === 'images' && (
        <ImageListPage config={config} onBack={() => setPage({ name: 'files' })} />
      )}

      {page.name === 'help' && (
        <HelpPage
          onBack={() => setPage(page.from === 'settings' ? { name: 'settings' } : { name: 'files' })}
        />
      )}

      {page.name === 'about' && (
        <AboutPage onBack={() => setPage({ name: 'files' })} />
      )}

      {page.name === 'files' && (
        <FileListPage
          key={refreshKey}
          config={config}
          onOpenSettings={() => setPage({ name: 'settings' })}
          onOpenDrafts={() => setPage({ name: 'drafts' })}
          onOpenImages={() => setPage({ name: 'images' })}
          onOpenHelp={() => setPage({ name: 'help', from: 'files' })}
          onOpenAbout={() => setPage({ name: 'about' })}
          onOpenFile={(path, isNew = false) => openEditor(path, isNew, 'files')}
        />
      )}
    </div>
  )
}