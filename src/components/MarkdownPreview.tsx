import { useEffect, useMemo, useRef } from 'react'
import mermaid from 'mermaid'
import type { RepoConfig } from '../types'
import { createMarkdown } from '../lib/markdown'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
})

let mermaidCounter = 0

interface Props {
  config: RepoConfig
  content: string
}

export default function MarkdownPreview({ config, content }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const html = useMemo(
    () => createMarkdown(config).render(content),
    [config, content],
  )

  // 图片 fallback
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const imgs = root.querySelectorAll<HTMLImageElement>('img[data-raw-src]')
    const handlers: Array<{ el: HTMLImageElement; fn: () => void }> = []
    imgs.forEach(img => {
      const rawSrc = img.getAttribute('data-raw-src')
      if (!rawSrc) return
      const fn = () => {
        if (img.src === rawSrc) return
        img.src = rawSrc
      }
      img.addEventListener('error', fn)
      handlers.push({ el: img, fn })
      if (img.complete && img.naturalWidth === 0) fn()
    })
    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener('error', fn))
    }
  }, [html])

  // mermaid 渲染
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
          if (!cancelled) {
            node.innerHTML = `<pre style="color:#c62828;font-size:12px">Mermaid 渲染失败: ${e.message}</pre>`
          }
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [html])

  return (
    <div
      ref={ref}
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 16,
        fontSize: 15,
        lineHeight: 1.7,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}