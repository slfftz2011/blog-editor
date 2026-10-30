import { useEffect, useMemo, useRef } from 'react'
import mermaid from 'mermaid'
import type { RepoConfig } from '../types'
import { createMarkdown } from '../lib/markdown'

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
let mermaidCounter = 0

interface Props {
  config: RepoConfig
  content: string
}

export default function MarkdownPreview({ config, content }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const html = useMemo(() => createMarkdown(config).render(content), [config, content])

  // 图片处理（兼容 Markdown 和纯 HTML 标签）
  useEffect(() => {
    const root = ref.current
    if (!root) return

    const imagePrefix = config.imageUrlPrefix.replace(/\/+$/, '') + '/'
    const imageDir = config.imageDir.replace(/\/+$/, '') + '/'
    const rawBase = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/`
    const pagesBase = config.pagesBaseUrl.trim().replace(/\/+$/, '')

    const imgs = root.querySelectorAll<HTMLImageElement>('img')
    const handlers: Array<{ el: HTMLImageElement; fn: () => void }> = []

    imgs.forEach(img => {
      const src = img.getAttribute('src') || ''
      let rawUrl = ''

      // 处理所有以 /images/ 开头的图片（不论来源）
      if (src.startsWith(imagePrefix)) {
        const fileName = src.substring(imagePrefix.length)
        rawUrl = rawBase + imageDir + fileName
        if (pagesBase) {
          img.setAttribute('src', pagesBase + imagePrefix + fileName)
          img.setAttribute('data-raw-src', rawUrl)
        } else {
          img.setAttribute('src', rawUrl)
        }
      }

      // 如果配置了 raw fallback，监听报错
      const targetRaw = img.getAttribute('data-raw-src')
      if (targetRaw) {
        const fn = () => {
          if (img.src === targetRaw) return
          img.src = targetRaw
        }
        img.addEventListener('error', fn)
        handlers.push({ el: img, fn })
        if (img.complete && img.naturalWidth === 0) fn()
      }
    })

    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener('error', fn))
    }
  }, [html, config])

  // Mermaid 渲染
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
          if (!cancelled) node.innerHTML = `<pre style="color:#c62828;font-size:12px">Mermaid 错误: ${e.message}</pre>`
        }
      }
    })()
    return () => { cancelled = true }
  }, [html])

  return (
    <div
      ref={ref}
      style={{ height: '100%', overflow: 'auto', padding: 16, fontSize: 15, lineHeight: 1.7 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}