import { useEffect, useMemo, useRef } from 'react'
import mermaid from 'mermaid'
import type { RepoConfig } from '../types'
import { createMarkdown } from '../lib/markdown'

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
let mermaidCounter = 0

interface Props {
  config: RepoConfig
  content: string
  pendingImages?: { id: string; base64: string }[]
}

export default function MarkdownPreview({ config, content, pendingImages = [] }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const html = useMemo(() => createMarkdown(config).render(content), [config, content])

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const imageDir = config.imageDir.replace(/\/+$/, '') + '/'
    const rawBase = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/`

    const imgs = root.querySelectorAll<HTMLImageElement>('img')
    imgs.forEach(img => {
      const src = img.getAttribute('src') || ''
      
      // 1. 优先处理本地暂存
      const pending = pendingImages.find((p: any) => src.includes(p.id))
      if (pending) {
        img.setAttribute('src', `data:image/jpeg;base64,${pending.base64}`)
        return
      }

      // 2. 远程获取：只要不是 http 开头，直接截取文件名去 raw 拿
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const fileName = src.split('/').pop() || ''
        if (!fileName) return
        img.setAttribute('src', rawBase + imageDir + fileName)
      }
    })
  }, [html, config, pendingImages])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const nodes = root.querySelectorAll<HTMLElement>('.mermaid')
    if (nodes.length === 0) return
    let cancelled = false
    ;(async () => {
      for (const node of Array.from(nodes)) {
        if (cancelled) return
        const code = node.textContent ?? ''
        if (!code.trim()) continue
        const id = `mmd-${++mermaidCounter}`
        try {
          const { svg } = await mermaid.render(id, code)
          if (!cancelled) node.innerHTML = svg
        } catch (e: any) {
          if (!cancelled) node.innerHTML = `<pre class="mermaid-error">Mermaid 错误: ${e.message}</pre>`
        }
      }
    })()
    return () => { cancelled = true }
  }, [html])

  return (
    <div className="preview-scroll">
      <div ref={ref} className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}