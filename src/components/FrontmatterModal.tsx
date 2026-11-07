import { useState, useEffect } from 'react'

interface Props {
  isOpen: boolean
  content: string
  onClose: () => void
  onSave: (newContent: string) => void
}

// 提取头部的简单 YAML
function extractFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return { meta: {}, body: content }

  const metaStr = match[1]
  const body = content.slice(match[0].length)
  const meta: Record<string, string> = {}

  metaStr.split('\n').forEach(line => {
    const idx = line.indexOf(':')
    if (idx > -1) {
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      meta[key] = val
    }
  })

  return { meta, body }
}

// 重新拼接 YAML
function buildContent(meta: Record<string, string>, body: string) {
  let yaml = '---\n'
  Object.entries(meta).forEach(([k, v]) => {
    if (v) yaml += `${k}: ${v}\n` // 忽略空值
  })
  yaml += '---\n'
  return yaml + body.trimStart()
}

export default function FrontmatterModal({ isOpen, content, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [tags, setTags] = useState('')
  const [otherMeta, setOtherMeta] = useState<Record<string, string>>({})
  const [body, setBody] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const { meta, body } = extractFrontmatter(content)
    setTitle(meta.title || '')
    setDate(meta.date || '')
    setTags(meta.tags || '')
    setBody(body)
    
    // 保存其他未知字段，防止丢失
    const others = { ...meta }
    delete others.title
    delete others.date
    delete others.tags
    setOtherMeta(others)
  }, [isOpen, content])

  if (!isOpen) return null

  function handleSave() {
    const newMeta = {
      title,
      date,
      tags,
      ...otherMeta,
    }
    const newContent = buildContent(newMeta, body)
    onSave(newContent)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 480, padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
      }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>文章属性</h2>
        
        <div className="field">
          <label className="field__label">标题 (title)</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="留空则使用文件名" />
        </div>
        
        <div className="field">
          <label className="field__label">日期 (date)</label>
          <input className="input" value={date} onChange={e => setDate(e.target.value)} placeholder="YYYY-MM-DD HH:mm:ss" />
        </div>
        
        <div className="field">
          <label className="field__label">标签 (tags)</label>
          <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="多个标签用逗号分隔，如：生活, 随笔" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button className="btn btn--ghost" onClick={onClose}>取消</button>
          <button className="btn btn--primary" onClick={handleSave}>应用修改</button>
        </div>
      </div>
    </div>
  )
}