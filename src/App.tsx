import { useState } from 'react'
import { loadConfig } from './lib/storage'
import type { RepoConfig } from './types'
import SettingsPage from './pages/SettingsPage'
import FileListPage from './pages/FileListPage'
import React from 'react'

type Page = { name: 'settings' } | { name: 'files' }

export default function App() {
  const [initial] = useState<RepoConfig | null>(() => {
    const c = loadConfig()
    return c.token ? c : null
  })
  const [config, setConfig] = useState<RepoConfig | null>(initial)
  const [page, setPage] = useState<Page>(
    initial ? { name: 'files' } : { name: 'settings' },
  )

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

  return (
    <FileListPage
      config={config}
      onOpenSettings={() => setPage({ name: 'settings' })}
      onOpenFile={path => alert(`编辑：${path}\n（下一批实现编辑器）`)}
    />
  )
}