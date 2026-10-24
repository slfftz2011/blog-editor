import { useState } from 'react'
import { loadConfig } from './lib/storage'
import type { RepoConfig } from './types'
import SettingsPage from './pages/SettingsPage'
import FileListPage from './pages/FileListPage'
import EditorPage from './pages/EditorPage'

type Page =
  | { name: 'settings' }
  | { name: 'files' }
  | { name: 'editor'; path: string; isNew: boolean }

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
        onBack={() => setPage({ name: 'files' })}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    )
  }

  return (
    <FileListPage
      key={refreshKey}
      config={config}
      onOpenSettings={() => setPage({ name: 'settings' })}
      onOpenFile={(path, isNew = false) =>
        setPage({ name: 'editor', path, isNew })
      }
    />
  )
}