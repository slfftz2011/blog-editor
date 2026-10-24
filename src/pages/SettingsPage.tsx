import { useState } from 'react'
import type { RepoConfig } from '../types'
import { saveConfig, defaultConfig } from '../lib/storage'
import { testConnection } from '../lib/github'
import React from 'react'

interface Props {
  initial: RepoConfig | null
  onSaved: (cfg: RepoConfig) => void
  onCancel?: () => void
}

export default function SettingsPage({ initial, onSaved, onCancel }: Props) {
  const [cfg, setCfg] = useState<RepoConfig>(initial ?? defaultConfig)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

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

  function handleSave() {
    if (!cfg.token.trim()) {
      setResult({ ok: false, msg: 'PAT 不能为空' })
      return
    }
    saveConfig(cfg)
    onSaved(cfg)
  }

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>仓库配置</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        PAT 仅保存在本机浏览器 localStorage，建议使用 fine-grained token，
        只授权 blog 仓库的 Contents: Read and write 权限。
      </p>

      <Field label="Owner" value={cfg.owner} onChange={v => set('owner', v)} />
      <Field label="仓库名" value={cfg.repo} onChange={v => set('repo', v)} />
      <Field label="分支" value={cfg.branch} onChange={v => set('branch', v)} />
      <Field label="PAT" value={cfg.token} onChange={v => set('token', v)} type="password" />
      <Field label="文章目录" value={cfg.postsPath} onChange={v => set('postsPath', v)} />
      <Field label="图片目录" value={cfg.imageDir} onChange={v => set('imageDir', v)} />
      <Field label="图片 URL 前缀" value={cfg.imageUrlPrefix} onChange={v => set('imageUrlPrefix', v)} />

      {result && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            background: result.ok ? '#e8f5e9' : '#ffebee',
            color: result.ok ? '#2e7d32' : '#c62828',
            fontSize: 14,
          }}
        >
          {result.msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleTest} disabled={testing} style={btn('#1976d2')}>
          {testing ? '测试中…' : '测试连接'}
        </button>
        <button onClick={handleSave} style={btn('#43a047')}>保存并进入</button>
        {onCancel && <button onClick={onCancel} style={btn('#757575')}>取消</button>}
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #ccc',
          borderRadius: 8,
          fontSize: 15,
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function btn(bg: string): React.CSSProperties {
  return {
    padding: '10px 16px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    cursor: 'pointer',
  }
}