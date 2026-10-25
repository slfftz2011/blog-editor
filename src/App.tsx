import { useState } from 'react'
import { loadConfig } from './lib/storage'
import type { RepoConfig } from './types'
import SettingsPage from './pages/SettingsPage'
import FileListPage from './pages/FileListPage'
import EditorPage from './pages/EditorPage'
import DraftsPage from './pages/DraftsPage'

type BackTo = 'files' | 'drafts'

type Page =
  | { name: 'settings' }
  | { name: 'files' }
  | { name: 'drafts' }
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

  function openEditor(path: string, isNew: boolean, backTo: BackTo) {
    setPage({ name: 'editor', path, isNew, backTo })
  }

  function backFromEditor(backTo: BackTo) {
    if (backTo === 'files') {
      setPage({ name: 'files' })
    } else {
      setPage({ name: 'drafts' })
    }
    setRefreshKey(k => k + 1)
  }

  if (!config || page.name === 'settings') {
    return (
      <SettingsPage
        initial={config}
        onSaved={cfg => {
          setConfig(cfg)
          setPage({ name: 'files' })
        }}
        onCancel={config ? () => setPage({ name: 'files' }) : undefined}
      />
    )
  }

  if (page.name === 'editor') {
    return (
      <EditorPage
        config={config}
        path={page.path}
        isNew={page.isNew}
        onBack={() => backFromEditor(page.backTo)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    )
  }

  if (page.name === 'drafts') {
    return (
      <DraftsPage
        onBack={() => setPage({ name: 'files' })}
        onRestore={(path, isNew) => openEditor(path, isNew, 'drafts')}
      />
    )
  }

  return (
    <FileListPage
      key={refreshKey}
      config={config}
      onOpenSettings={() => setPage({ name: 'settings' })}
      onOpenDrafts={() => setPage({ name: 'drafts' })}
      onOpenFile={(path, isNew = false) => openEditor(path, isNew, 'files')}
    />
  )
}