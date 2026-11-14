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

    // 计算基础路径
    const rawBase = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/`
    const imageDir = config.imageDir.replace(/^\/+|\/+$/g, '') // 比如 source/images
    
    // 解析 Pages 地址和 Root 前缀
    let pagesBase = ''
    let rootPath = ''
    if (config.pagesBaseUrl) {
      pagesBase = config.pagesBaseUrl.replace(/\/+$/, '') // 比如 https://xx.github.io/blog
      try {
        const u = new URL(pagesBase)
        rootPath = u.pathname.replace(/\/+$/, '') // 提取出 /blog
      } catch {}
    }
    
    // 提取 imageUrlPrefix，比如 /images
    const imgPrefix = config.imageUrlPrefix.replace(/^\/+|\/+$/g, '')

    const imgs = root.querySelectorAll<HTMLImageElement>('img')
    const handlers: Array<{ el: HTMLImageElement; fn: () => void }> = []

    imgs.forEach(img => {
      const src = img.getAttribute('src') || ''
      if (!src) return

      // 1. 本地暂存图片
      const pending = pendingImages.find((p: any) => src.includes(p.id))
      if (pending) {
        img.setAttribute('src', `data:image/jpeg;base64,${pending.base64}`)
        img.removeAttribute('data-raw-src')
        return
      }

      // 2. 远端图片处理
      if (!src.startsWith('http') && !src.startsWith('data:')) {
        // 提取相对路径（比如 post1/a.jpg）
        let relPath = ''
        if (rootPath && src.startsWith(rootPath)) {
          relPath = src.substring(rootPath.length) // 去掉 /blog 变成 /images/post1/a.jpg
        } else {
          relPath = src
        }

        // 去掉开头的 /images/ 或者 /img/ (基于 imgPrefix)
        const prefixWithSlash = `/${imgPrefix}/`
        if (relPath.startsWith(prefixWithSlash)) {
          relPath = relPath.substring(prefixWithSlash.length)
        } else if (relPath.startsWith('/')) {
          relPath = relPath.substring(1) // 如果只有斜杠
        }

        // 现在 relPath 是 post1/a.jpg
        
        // 拼装 Raw 地址
        const rawUrl = rawBase + imageDir + '/' + relPath
        
        if (pagesBase) {
          // 拼装 Pages 真实地址
          const pagesUrl = `${pagesBase}/${imgPrefix}/${relPath}`
          img.setAttribute('src', pagesUrl)
          img.setAttribute('data-raw-src', rawUrl) // 作为 fallback
        } else {
          // 如果没配置 Pages，直接走 Raw
          img.setAttribute('src', rawUrl)
        }
      }

      // 3. 监听错误，降级到 Raw
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

    return () => handlers.forEach(({ el, fn }) => el.removeEventListener('error', fn))
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