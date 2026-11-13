import { useState, useEffect } from 'react'

interface Props {
  isOpen: boolean
  content: string
  onClose: () => void
  onSave: (newContent: string) => void
}

// 解析简单的 YAML Front-matter（兼容单行/多行数组）
function extractFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { meta: {}, body: content }

  const yamlStr = match[1]
  const body = content.slice(match[0].length)
  const meta: Record<string, any> = {}

  const lines = yamlStr.split(/\r?\n/)
  let currentKey: string | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue // 跳过空行

    // 如果是列表项 "- xxx"
    if (line.trim().startsWith('- ')) {
      if (currentKey) {
        if (!Array.isArray(meta[currentKey])) {
          meta[currentKey] = [] // 将原本的空字符串转为数组
        }
        meta[currentKey].push(line.trim().slice(2).trim())
      }
      continue
    }

    // 如果是普通键值对 "key: value"
    const idx = line.indexOf(':')
    if (idx > -1 && (line[0] !== ' ' && line[0] !== '\t')) {
      const key = line.slice(0, idx).trim()
      const rawVal = line.slice(idx + 1).trim()
      
      currentKey = key

      let parsedVal: string | string[] = rawVal

      // 处理单行数组格式 [tag1, tag2]
      if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        parsedVal = rawVal.slice(1, -1).split(',').map((s: string) => s.trim()).filter(Boolean)
      } else if (rawVal !== '') {
        // 如果包含引号，去掉外层引号
        if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
          parsedVal = rawVal.slice(1, -1)
        }
      }
      
      meta[key] = parsedVal
    }
  }

  return { meta, body }
}

// 拼接 YAML（统一将数组生成多行格式，最安全）
function buildContent(meta: Record<string, any>, body: string) {
  let yaml = '---\n'
  Object.entries(meta).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) {
      if (v.length === 0) return
      yaml += `${k}:\n`
      v.forEach(item => {
        yaml += `  - ${item}\n`
      })
    } else {
      yaml += `${k}: ${v}\n`
    }
  })
  yaml += '---\n'
  return yaml + body.trimStart()
}
// 常用字段预设（适配 Butterfly）
const PRESET_FIELDS = [
  { key: 'title', label: '标题', placeholder: '文章标题' },
  { key: 'date', label: '日期', placeholder: 'YYYY-MM-DD HH:mm:ss' },
  { key: 'categories', label: '分类', placeholder: '多个分类用逗号分隔' },
  { key: 'tags', label: '标签', placeholder: '多个标签用逗号分隔' },
  { key: 'description', label: '摘要', placeholder: '用于 SEO 和首页展示' },
  { key: 'cover', label: '封面图', placeholder: '/images/cover.jpg' },
  { key: 'top_img', label: '顶部图', placeholder: '/images/top.jpg' },
]

export default function FrontmatterModal({ isOpen, content, onClose, onSave }: Props) {
  const [meta, setMeta] = useState<Record<string, any>>({})
  const [body, setBody] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const res = extractFrontmatter(content)
    setMeta(res.meta)
    setBody(res.body)
  }, [isOpen, content])

  if (!isOpen) return null

  function handleSave() {
    const newContent = buildContent(meta, body)
    onSave(newContent)
    onClose()
  }

  const handleChange = (key: string, val: string) => {
    let finalVal: any = val
    // 对 categories 和 tags 做数组处理
    if (key === 'categories' || key === 'tags') {
      finalVal = val.split(',').map(s => s.trim()).filter(Boolean)
    }
    setMeta(prev => ({ ...prev, [key]: finalVal }))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 480, maxHeight: '90vh', 
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)', 
      }}>
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>文章属性 (Front-matter)</h2>
          <p className="text-xs text-secondary" style={{ marginTop: 4 }}>支持 Butterfly 等主题的常用配置</p>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
          {PRESET_FIELDS.map(field => {
            const rawVal = meta[field.key]
            const displayVal = Array.isArray(rawVal) ? rawVal.join(', ') : (rawVal || '')
            return (
              <div className="field" key={field.key}>
                <label className="field__label">{field.label} ({field.key})</label>
                <input 
                  className="input" 
                  value={displayVal} 
                  onChange={e => handleChange(field.key, e.target.value)} 
                  placeholder={field.placeholder} 
                />
              </div>
            )
          })}

          <div style={{ marginTop: 'var(--space-6)', borderTop: '1px dashed var(--border)', paddingTop: 'var(--space-4)' }}>
            <h3 className="text-sm" style={{ marginBottom: 'var(--space-3)' }}>其他自定义字段</h3>
            {Object.entries(meta).map(([k, v]) => {
              if (PRESET_FIELDS.some(f => f.key === k)) return null
              return (
                <div className="field" key={k}>
                  <label className="field__label">{k}</label>
                  <input 
                    className="input" 
                    value={Array.isArray(v) ? v.join(', ') : v} 
                    onChange={e => handleChange(k, e.target.value)} 
                  />
                </div>
              )
            })}
            <button 
              className="btn btn--ghost btn--sm" 
              onClick={() => {
                const key = window.prompt('输入自定义字段名 (如 mathjax, highlight_shrink)')
                if (key && !meta[key]) setMeta(prev => ({ ...prev, [key]: '' }))
              }}
            >
              + 添加自定义字段
            </button>
          </div>
        </div>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn--ghost" onClick={onClose}>取消</button>
          <button className="btn btn--primary" onClick={handleSave}>应用修改</button>
        </div>
      </div>
    </div>
  )
}