import { useState, useEffect } from 'react'
import { loadConfig, saveConfig } from './lib/storage'
import type { RepoConfig } from './types'
import SettingsPage from './pages/SettingsPage'
import FileListPage from './pages/FileListPage'
import EditorPage from './pages/EditorPage'
import DraftsPage from './pages/DraftsPage'
import HelpPage from './pages/HelpPage'
import AboutPage from './pages/AboutPage'
import ImageListPage from './pages/ImageListPage'
import CreateRepoPage from './pages/CreateRepoPage'

type BackTo = 'files' | 'drafts'

type Page =
  | { name: 'settings' }
  | { name: 'files' }
  | { name: 'drafts' }
  | { name: 'images' }
  | { name: 'help'; from: 'files' | 'settings' }
  | { name: 'about' }
  | { name: 'create-repo' }
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

  useEffect(() => {
    if (page.name !== 'files' && page.name !== 'settings' && page.name !== 'help') {
      window.history.pushState({ page: page.name }, '')
    }
    const handlePopState = () => {
      if (page.name === 'files' || (page.name === 'settings' && config)) return
      if (page.name === 'editor') {
        setPage(page.backTo === 'drafts' ? { name: 'drafts' } : { name: 'files' })
        setRefreshKey(k => k + 1)
      } else if (page.name === 'help') {
        setPage(page.from === 'settings' ? { name: 'settings' } : { name: 'files' })
      } else if (page.name === 'create-repo') {
        setPage({ name: 'settings' })
      } else {
        setPage({ name: 'files' })
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [page, config])

  if (page.name === 'help') {
    return (
      <div className="animate-fade-in" key="help">
        <HelpPage onBack={() => setPage(page.from === 'settings' ? { name: 'settings' } : { name: 'files' })} />
      </div>
    )
  }

  if (page.name === 'create-repo' && config) {
    return (
      <div className="animate-fade-in" key="create-repo">
        <CreateRepoPage
          config={config}
          onBack={() => setPage({ name: 'settings' })}
          onCreated={newRepoName => {
            const newConfig = { ...config, repo: newRepoName }
            setConfig(newConfig)
            saveConfig(newConfig)
            setPage({ name: 'files' })
            setRefreshKey(k => k + 1)
          }}
        />
      </div>
    )
  }

  if (!config || page.name === 'settings') {
    return (
      <div className="animate-fade-in" key="settings">
        <SettingsPage
          initial={config}
          onSaved={cfg => { setConfig(cfg); setPage({ name: 'files' }) }}
          onCancel={config ? () => setPage({ name: 'files' }) : undefined}
          onHelp={() => setPage({ name: 'help', from: 'settings' })}
          onOpenCreateRepo={() => setPage({ name: 'create-repo' })}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" key={page.name}>
      {page.name === 'editor' && (
        <EditorPage
          config={config}
          path={page.path}
          isNew={page.isNew}
          onBack={() => {
            setPage(page.backTo === 'drafts' ? { name: 'drafts' } : { name: 'files' })
            setRefreshKey(k => k + 1)
          }}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
      {page.name === 'drafts' && (
        <DraftsPage
          onBack={() => setPage({ name: 'files' })}
          onRestore={(path, isNew) => setPage({ name: 'editor', path, isNew, backTo: 'drafts' })}
        />
      )}
      {page.name === 'images' && (
        <ImageListPage config={config} onBack={() => setPage({ name: 'files' })} />
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
          onOpenFile={(path, isNew = false) => setPage({ name: 'editor', path, isNew, backTo: 'files' })}
        />
      )}
    </div>
  )
}