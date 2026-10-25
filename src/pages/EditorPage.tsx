import { useEffect, useRef, useState } from 'react'
import type { RepoConfig } from '../types'
import { readFile, writeFile, uploadBinaryFile } from '../lib/github'
import { pickImage } from '../lib/camera'
import { saveDraft, loadDraft, clearDraft } from '../lib/draft'
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

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const NEW_TEMPLATE = `---\ntitle: 新文章\ndate: ${formatNow()}\ntags:\n---\n\n`

export default function EditorPage({ config, path, isNew, onBack, onSaved }: Props) {
  const [content, setContent] = useState(isNew ? NEW_TEMPLATE : '')
  const [sha, setSha] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('edit')
  const [draftPrompt, setDraftPrompt] = useState<{ content: string; savedAt: number } | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)

  const editorApi = useRef<EditorApi | null>(null)
  const baselineRef = useRef<string | null>(isNew ? NEW_TEMPLATE : null)
  const contentRef = useRef(content)
  contentRef.current = content

  // 加载远端内容 + 检查草稿
  useEffect(() => {
    if (isNew) {
      const draft = loadDraft(path)
      if (draft && draft.content !== NEW_TEMPLATE) {
        setDraftPrompt({ content: draft.content, savedAt: draft.savedAt })
      }
      return
    }
    let cancelled = false
    setLoading(true)
    readFile(config, path)
      .then(({ content: remote, sha }) => {
        if (cancelled) return
        setContent(remote)
        setSha(sha)
        baselineRef.current = remote
        const draft = loadDraft(path)
        if (draft && draft.content !== remote) {
          setDraftPrompt({ content: draft.content, savedAt: draft.savedAt })
        }
      })
      .catch(e => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [config, path, isNew])

  // 防抖暂存：内容变化后 800ms 写入
  useEffect(() => {
    if (loading) return
    if (baselineRef.current === null) return
    if (content === baselineRef.current) return
    const t = setTimeout(() => {
      saveDraft(path, content, isNew)
      setDraftSavedAt(Date.now())
    }, 800)
    return () => clearTimeout(t)
  }, [content, path, isNew, loading])

  // 切后台 / 关闭页面时立即暂存
  useEffect(() => {
    function flush() {
      if (baselineRef.current !== null && contentRef.current !== baselineRef.current) {
        saveDraft(path, contentRef.current, isNew)
      }
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', flush)
    }
  }, [path, isNew])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const message = isNew ? `new post: ${path}` : `update: ${path}`
      await writeFile(config, path, content, message, sha)
      const fresh = await readFile(config, path)
      setSha(fresh.sha)
      baselineRef.current = content
      clearDraft(path)
      setDraftSavedAt(null)
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
    setUploading(true)
    try {
      const base64 = await pickImage(source)
      if (!base64) {
        setUploading(false)
        return
      }
      const fileName = `img_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}.jpg`
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

  function restoreDraft() {
    if (!draftPrompt) return
    setContent(draftPrompt.content)
    setDraftPrompt(null)
  }

  function discardDraft() {
    if (!draftPrompt) return
    clearDraft(path)
    setDraftPrompt(null)
    setDraftSavedAt(null)
  }

  if (loading) return <div style={{ padding: 16 }}>加载中…</div>

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
        <button
          onClick={() => handleInsertImage('camera')}
          disabled={uploading}
          style={btn('#8e24aa')}
        >
          {uploading ? '处理中…' : '拍照'}
        </button>
        <button
          onClick={() => handleInsertImage('gallery')}
          disabled={uploading}
          style={btn('#8e24aa')}
        >
          相册
        </button>
        <button onClick={handleSave} disabled={saving} style={btn('#43a047')}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      {draftPrompt && (
        <div
          style={{
            padding: '10px 12px',
            background: '#fff8e1',
            borderBottom: '1px solid #ffe082',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ flex: 1, fontSize: 13, color: '#6d4c41', minWidth: 160 }}>
            发现 {formatRelative(draftPrompt.savedAt)} 的草稿
          </span>
          <button onClick={restoreDraft} style={btn('#f9a825')}>恢复</button>
          <button onClick={discardDraft} style={btn('#e0e0e0', '#333')}>丢弃</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #e0e0e0', alignItems: 'center' }}>
        <ModeBtn active={mode === 'edit'} onClick={() => setMode('edit')}>编辑</ModeBtn>
        <ModeBtn active={mode === 'preview'} onClick={() => setMode('preview')}>预览</ModeBtn>
        <ModeBtn active={mode === 'split'} onClick={() => setMode('split')}>分屏</ModeBtn>
        {savedAt && <span style={{ marginLeft: 8, fontSize: 12, color: '#2e7d32' }}>已保存</span>}
        {draftSavedAt && !savedAt && (
          <span style={{ marginLeft: 8, fontSize: 12, color: '#9e9e9e' }}>草稿已暂存</span>
        )}
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

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
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

function btn(bg: string, color = '#fff'): React.CSSProperties {
  return {
    padding: '8px 12px',
    background: bg,
    color,
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  }
}