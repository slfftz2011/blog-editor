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

    // 统一路径处理：去掉末尾的 /
    const cleanRoot = config.root.endsWith('/') ? config.root.slice(0, -1) : config.root
    const cleanImgPrefix = config.imageUrlPrefix.startsWith('/') ? config.imageUrlPrefix.slice(1) : config.imageUrlPrefix
    const cleanImgDir = config.imageDir.replace(/^\/+|\/+$/g, '')
    
    // 完整的相对匹配前缀，如 /blog/img/
    const matchPrefix = `${cleanRoot}/${cleanImgPrefix}/`

    // CDN 地址（替代 raw）
    const jsDelivrBase = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@${config.branch}/`

    const imgs = root.querySelectorAll<HTMLImageElement>('img')
    const handlers: Array<{ el: HTMLImageElement; fn: () => void }> = []

    imgs.forEach(img => {
      const src = img.getAttribute('src') || ''
      if (!src) return

      // 1. 本地暂存图
      const pending = pendingImages.find((p: any) => src.includes(p.id))
      if (pending) {
        img.setAttribute('src', `data:image/jpeg;base64,${pending.base64}`)
        return
      }

      // 2. 远端图处理
      if (!src.startsWith('http') && !src.startsWith('data:')) {
        // 尝试提取相对路径，比如 /blog/img/post1/a.jpg -> post1/a.jpg
        let relPath = src
        if (src.startsWith(matchPrefix)) {
          relPath = src.substring(matchPrefix.length)
        } else if (src.startsWith('/')) {
          // 如果不是标准的 root+prefix，兜底去掉开头的 /
          relPath = src.substring(1)
        }

        // 拼装 CDN 地址
        const cdnUrl = jsDelivrBase + cleanImgDir + '/' + relPath
        
        if (config.pagesBaseUrl) {
          // 优先使用 Hexo 实际部署的 Pages 地址（速度最快）
          const pagesUrl = `${config.pagesBaseUrl.replace(/\/+$/, '')}${matchPrefix}${relPath}`
          img.setAttribute('src', pagesUrl)
          img.setAttribute('data-cdn-src', cdnUrl) // CDN 作为后备
        } else {
          // 没填域名，直接用 CDN
          img.setAttribute('src', cdnUrl)
        }
      }

      // 3. Pages 加载失败降级到 CDN
      const targetCdn = img.getAttribute('data-cdn-src')
      if (targetCdn) {
        const fn = () => {
          if (img.src === targetCdn) return
          img.src = targetCdn
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