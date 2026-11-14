import { useEffect, useRef, useState } from 'react'
import type { RepoConfig } from '../types'
import { readFile, writeFile, uploadBinaryFile } from '../lib/github'
import { pickImage } from '../lib/camera'
import { saveDraft, loadDraft, clearDraft } from '../lib/draft'
import { useToast } from '../lib/toast'
import MarkdownEditor, { EditorApi } from '../components/MarkdownEditor'
import MarkdownPreview from '../components/MarkdownPreview'
import { MarkdownToolbar, KeypadToolbar } from '../components/EditorToolbar'
import FrontmatterModal from '../components/FrontmatterModal'

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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 768)
  const [pendingImages, setPendingImages] = useState<{ id: string, base64: string }[]>([])

  const editorApi = useRef<EditorApi | null>(null)
  const baselineRef = useRef<string | null>(isNew ? NEW_TEMPLATE : null)
  const contentRef = useRef(content)
  contentRef.current = content

  useEffect(() => {
    const onResize = () => setIsWideScreen(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (isKeyboardOpen && !isWideScreen && mode === 'split') {
      setMode('edit')
    }
  }, [isKeyboardOpen, isWideScreen, mode])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      const isOpen = window.innerHeight - vv.height > 200
      setIsKeyboardOpen(isOpen)
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

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

  // 根据 Setting 里的 Pages 地址自动生成 root 前缀
  function getImgPrefix() {
    let root = ''
    try {
      if (config.pagesBaseUrl) {
        const url = new URL(config.pagesBaseUrl)
        root = url.pathname.replace(/\/+$/, '') // 提取出 /blog
      }
    } catch {}
    const imgDir = config.imageUrlPrefix.replace(/^\/+|\/+$/g, '') // 提取出 images
    const combined = [root, imgDir].filter(Boolean).join('/')
    return combined.startsWith('/') ? combined : '/' + combined // 最终得到 /blog/images
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
      const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      setPendingImages(prev => [...prev, { id, base64 }])
      
      const prefix = getImgPrefix()
      const markdown = `![image](${prefix}/${id}.jpg)`
      
      editorApi.current?.insert(markdown)
      editorApi.current?.focus()
      toast.show('图片已插入（将在保存时上传）', 'info')
    } catch (e: any) {
      setError(`图片处理失败：${e.message}`)
      toast.show(`图片处理失败：${e.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      let finalContent = content
      if (pendingImages.length > 0) {
        toast.show('正在上传图片...', 'info')
        for (const img of pendingImages) {
          const imagePath = `${config.imageDir.replace(/\/+$/, '')}/${img.id}.jpg`
          await uploadBinaryFile(config, imagePath, img.base64, `upload image: ${img.id}.jpg`)
        }
        setPendingImages([])
      }

      const message = isNew ? `new post: ${path}` : `update: ${path}`
      await writeFile(config, path, finalContent, message, sha)
      const fresh = await readFile(config, path)
      setSha(fresh.sha)
      baselineRef.current = finalContent
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

  if (loading) return <div className="editor-shell"><div className="empty">加载中…</div></div>

  const showToolbar = mode !== 'preview'

  return (
    <div className="editor-shell">
      <div className="editor-header">
        <button className="btn btn--ghost" onClick={onBack}>返回</button>
        <span className="editor-path">{path}</span>
        <button className="btn btn--outline" onClick={() => setShowMeta(true)}>⚙️ 属性</button>
        <button className="btn btn--outline" onClick={() => handleInsertImage('camera')} disabled={uploading}>
          {uploading ? '处理中…' : '拍照'}
        </button>
        <button className="btn btn--outline" onClick={() => handleInsertImage('gallery')} disabled={uploading}>相册</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      {draftPrompt && (
        <div className="draft-prompt">
          <span className="draft-prompt__text">发现 {formatRelative(draftPrompt.savedAt)} 的草稿</span>
          <button className="btn btn--primary" onClick={() => { setContent(draftPrompt.content); setDraftPrompt(null) }}>恢复</button>
          <button className="btn btn--outline" onClick={() => { clearDraft(path); setDraftPrompt(null); setDraftSavedAt(null) }}>丢弃</button>
        </div>
      )}

      <div className="mode-bar">
        <div className="segmented" role="group">
          <button aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>编辑</button>
          <button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>预览</button>
          {isWideScreen && <button aria-pressed={mode === 'split'} onClick={() => setMode('split')}>分屏</button>}
        </div>
        {savedAt && <span className="mode-bar__status mode-bar__status--saved">已保存</span>}
        {draftSavedAt && !savedAt && <span className="mode-bar__status">草稿已暂存</span>}
      </div>

      {showToolbar && <MarkdownToolbar api={() => editorApi.current} />}
      {error && <div className="editor-error">{error}</div>}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {mode === 'edit' && <MarkdownEditor value={content} onChange={setContent} onReady={api => (editorApi.current = api)} />}
        {mode === 'preview' && <MarkdownPreview config={config} content={content} pendingImages={pendingImages} />}
        {mode === 'split' && (
          <div className="split-container">
            <div className="split-pane">
              <MarkdownEditor value={content} onChange={setContent} onReady={api => (editorApi.current = api)} />
            </div>
            {!isKeyboardOpen && (
              <div className="split-pane">
                <MarkdownPreview config={config} content={content} pendingImages={pendingImages} />
              </div>
            )}
          </div>
        )}
      </div>
      
      <KeypadToolbar api={() => editorApi.current} />
      
      <FrontmatterModal 
        isOpen={showMeta} content={content} onClose={() => setShowMeta(false)}
        onSave={(newContent) => { setContent(newContent); toast.show('属性已更新', 'info') }}
      />
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