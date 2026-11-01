import { useEffect, useRef, useState } from 'react'
import type { RepoConfig } from '../types'
import { readFile, writeFile, uploadBinaryFile } from '../lib/github'
import { pickImage } from '../lib/camera'
import { saveDraft, loadDraft, clearDraft } from '../lib/draft'
import { useToast } from '../lib/toast'
import MarkdownEditor, { EditorApi } from '../components/MarkdownEditor'
import MarkdownPreview from '../components/MarkdownPreview'
import EditorToolbar from '../components/EditorToolbar'

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
  const toast = useToast()
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
      toast.show('已提交到 GitHub', 'success')
      onSaved()
    } catch (e: any) {
      setError(e.message)
      toast.show(`保存失败：${e.message}`, 'error')
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
      const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      const imagePath = `${config.imageDir.replace(/\/+$/, '')}/${fileName}`
      await uploadBinaryFile(config, imagePath, base64, `upload image: ${fileName}`)
      const markdown = `![image](${config.imageUrlPrefix.replace(/\/+$/, '')}/${fileName})`
      editorApi.current?.insert(markdown)
      editorApi.current?.focus()
      toast.show('图片已上传并插入', 'success')
    } catch (e: any) {
      setError(`图片上传失败：${e.message}`)
      toast.show(`图片上传失败：${e.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  function restoreDraft() {
    if (!draftPrompt) return
    setContent(draftPrompt.content)
    setDraftPrompt(null)
    toast.show('已恢复草稿', 'info')
  }

  function discardDraft() {
    if (!draftPrompt) return
    clearDraft(path)
    setDraftPrompt(null)
    setDraftSavedAt(null)
    toast.show('已丢弃草稿', 'info')
  }

  if (loading) {
    return (
      <div className="editor-shell">
        <div className="empty">加载中…</div>
      </div>
    )
  }

  const showToolbar = mode !== 'preview'

  return (
    <div className="editor-shell">
      <div className="editor-header">
        <button className="btn btn--ghost" onClick={onBack}>返回</button>
        <span className="editor-path">{path}</span>
        <button
          className="btn btn--outline"
          onClick={() => handleInsertImage('camera')}
          disabled={uploading}
        >
          {uploading ? '处理中…' : '拍照'}
        </button>
        <button
          className="btn btn--outline"
          onClick={() => handleInsertImage('gallery')}
          disabled={uploading}
        >
          相册
        </button>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      {draftPrompt && (
        <div className="draft-prompt">
          <span className="draft-prompt__text">
            发现 {formatRelative(draftPrompt.savedAt)} 的草稿
          </span>
          <button className="btn btn--primary" onClick={restoreDraft}>恢复</button>
          <button className="btn btn--outline" onClick={discardDraft}>丢弃</button>
        </div>
      )}

      <div className="mode-bar">
        <div className="segmented" role="group" aria-label="视图模式">
          <button aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>编辑</button>
          <button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>预览</button>
          <button aria-pressed={mode === 'split'} onClick={() => setMode('split')}>分屏</button>
        </div>
        {savedAt && (
          <span className="mode-bar__status mode-bar__status--saved">已保存</span>
        )}
        {draftSavedAt && !savedAt && (
          <span className="mode-bar__status">草稿已暂存</span>
        )}
      </div>

      {showToolbar && <EditorToolbar api={() => editorApi.current} />}

      {error && <div className="editor-error">{error}</div>}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {mode === 'edit' && (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onReady={api => (editorApi.current = api)}
          />
        )}
        {mode === 'preview' && <MarkdownPreview config={config} content={content} />}
        {mode === 'split' && (
          <div className="split-container">
            <div className="split-pane">
              <MarkdownEditor
                value={content}
                onChange={setContent}
                onReady={api => (editorApi.current = api)}
              />
            </div>
            <div className="split-pane">
              <MarkdownPreview config={config} content={content} />
            </div>
          </div>
        )}
      </div>
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