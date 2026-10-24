import { useEffect, useState } from 'react'
import type { RepoConfig, FileItem } from '../types'
import { listMdFiles } from '../lib/github'
import React from 'react'

interface Props {
  config: RepoConfig
  onOpenSettings: () => void
  onOpenFile: (path: string) => void
}

export default function FileListPage({ config, onOpenSettings, onOpenFile }: Props) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listMdFiles(config)
      .then(list => !cancelled && setFiles(list))
      .catch(e => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [config])

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>文章列表</h1>
        <button
          onClick={onOpenSettings}
          style={{
            padding: '8px 12px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          设置
        </button>
      </div>

      <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
        {config.owner}/{config.repo} @ {config.branch}
      </p>

      {loading && <p>加载中…</p>}

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: '#ffebee',
            color: '#c62828',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <p style={{ color: '#999' }}>没有找到 .md 文件</p>
      )}

      {files.map(f => (
        <button
          key={f.path}
          onClick={() => onOpenFile(f.path)}
          style={{
            display: 'block',
            width: '100%',
            padding: 12,
            marginBottom: 6,
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            fontSize: 15,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          {f.name}
        </button>
      ))}
    </div>
  )
}