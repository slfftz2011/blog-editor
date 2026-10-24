import { useEffect, useRef, useState } from 'react'
import type { RepoConfig } from '../types'
import { readFile, writeFile, uploadBinaryFile } from '../lib/github'
import { pickImage } from '../lib/camera'
import MarkdownEditor, { EditorApi } from '../components/MarkdownEditor'
import MarkdownPreview from '../components/MarkdownPreview'

interface Props {
  config: RepoConfig
  path: string
  isNew: boolean
  onBack: () => void
  onSaved: () => void
}

type Mode = 'edit' | 'preview' | 'split'

const NEW_TEMPLATE = `---
title: 新文章
date: ${formatNow()}
tags:
---

`

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function EditorPage({ config, path, isNew, onBack, onSaved }: Props) {
  const [content, setContent] = useState(isNew ? NEW_TEMPLATE : '')
  const [sha, setSha] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('edit')
  const editorApi = useRef<EditorApi | null>(null)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    setLoading(true)
    readFile(config, path)
      .then(({ content, sha }) => {
        if (cancelled) return
        setContent(content)
        setSha(sha)
      })
      .catch(e => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [config, path, isNew])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const message = isNew
        ? `new post: ${path}`
        : `update: ${path}`
      await writeFile(config, path, content, message, sha)
      const fresh = await readFile(config, path)
      setSha(fresh.sha)
      setSavedAt(Date.now())
      onSaved()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleInsertImage(source: 'camera' | 'gallery') {
    setError(null)
    const base64 = await pickImage(source)
    if (!base64) return
    setUploading(true)
    try {
      const ext = 'jpg'
      const fileName = `img_${Date.now()}.${ext}`
      const imagePath = `${config.imageDir.replace(/\/+$/, '')}/${fileName}`
      await uploadBinaryFile(config, imagePath, base64, `upload image: ${fileName}`)
      const markdown = `![image](${config.imageUrlPrefix.replace(/\/+$/, '')}/${fileName})`
      editorApi.current?.insert(markdown)
      editorApi.current?.focus()
    } catch (e: any) {
      setError(`图片上传失败：${e.message}`)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 16 }}>加载中…</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid #e0e0e0',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={onBack} style={btn('#757575')}>返回</button>
        <span style={{ flex: 1, fontSize: 13, color: '#666', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {path}
        </span>
        <button onClick={() => handleInsertImage('camera')} disabled={uploading} style={btn('#8e24aa')}>
          {uploading ? '上传中…' : '拍照'}
        </button>
        <button onClick={() => handleInsertImage('gallery')} disabled={uploading} style={btn('#8e24aa')}>
          相册
        </button>
        <button onClick={handleSave} disabled={saving} style={btn('#43a047')}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>
        <ModeBtn active={mode === 'edit'} onClick={() => setMode('edit')}>编辑</ModeBtn>
        <ModeBtn active={mode === 'preview'} onClick={() => setMode('preview')}>预览</ModeBtn>
        <ModeBtn active={mode === 'split'} onClick={() => setMode('split')}>分屏</ModeBtn>
        {savedAt && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#2e7d32' }}>已保存</span>}
      </div>

      {error && (
        <div style={{ padding: 12, background: '#ffebee', color: '#c62828', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {mode === 'edit' && (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onReady={api => (editorApi.current = api)}
          />
        )}
        {mode === 'preview' && <MarkdownPreview content={content} />}
        {mode === 'split' && (
          <div className="split-container" style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <div style={{ flex: 1, minHeight: 0, minWidth: 0, borderBottom: '1px solid #e0e0e0' }}>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                onReady={api => (editorApi.current = api)}
              />
            </div>
            <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
              <MarkdownPreview content={content} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .split-container { flex-direction: column; }
        @media (orientation: landscape) {
          .split-container { flex-direction: row !important; }
        }
      `}</style>
    </div>
  )
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 6,
        border: '1px solid ' + (active ? '#1976d2' : '#ccc'),
        background: active ? '#1976d2' : '#fff',
        color: active ? '#fff' : '#333',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function btn(bg: string): React.CSSProperties {
  return {
    padding: '8px 12px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  }
}