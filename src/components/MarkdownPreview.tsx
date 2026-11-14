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

    // 1. 提取纯域名：即使用户填了 https://xxx.github.io/blog，也强行只取 https://xxx.github.io
    let origin = ''
    if (config.pagesBaseUrl) {
      try {
        origin = new URL(config.pagesBaseUrl).origin
      } catch {
        const m = config.pagesBaseUrl.match(/^(https?:\/\/[^/]+)/)
        if (m) origin = m[1]
      }
    }

    // 2. 清理路径（去除首尾多余的斜杠）
    let cleanRoot = config.root.startsWith('/') ? config.root : '/' + config.root
    if (cleanRoot.endsWith('/')) cleanRoot = cleanRoot.slice(0, -1)
    
    let cleanImgPrefix = config.imageUrlPrefix.startsWith('/') ? config.imageUrlPrefix.slice(1) : config.imageUrlPrefix
    if (cleanImgPrefix.endsWith('/')) cleanImgPrefix = cleanImgPrefix.slice(0, -1)
    
    // 组合出匹配前缀：例如 /blog/img/
    const matchPrefix = `${cleanRoot}/${cleanImgPrefix}/` 
    
    // 处理仓库路径
    const cleanImgDir = config.imageDir.replace(/^\/+|\/+$/g, '')

    // 3. 新的 CDN 降级代理 (ghproxy 代理 raw)
    const proxyRawBase = `https://ghproxy.net/https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/`

    const imgs = root.querySelectorAll<HTMLImageElement>('img')
    const handlers: Array<{ el: HTMLImageElement; fn: () => void }> = []

    imgs.forEach(img => {
      const src = img.getAttribute('src') || ''
      if (!src) return

      // 1. 本地暂存图片
      const pending = pendingImages.find((p: any) => src.includes(p.id))
      if (pending) {
        img.setAttribute('src', `data:image/jpeg;base64,${pending.base64}`)
        img.removeAttribute('data-cdn-src')
        return
      }

      // 2. 远端图片处理
      if (!src.startsWith('http') && !src.startsWith('data:')) {
        let relPath = src
        
        // 尝试截取真实的相对路径
        if (src.startsWith(matchPrefix)) {
          // 完美匹配：/blog/img/2025/... 截取为 2025/...
          relPath = src.substring(matchPrefix.length)
        } else {
          // 容错匹配：如果前缀对不上，直接把 img/ 及其后面的内容截出来
          const regex = new RegExp(`.*\\/${cleanImgPrefix}\\/`)
          relPath = src.replace(regex, '')
        }

        // 拼装代理 Raw 地址
        const proxyUrl = proxyRawBase + cleanImgDir + '/' + relPath
        
        if (origin) {
          // 拼装 Pages 真实地址：https://xxx.github.io/blog/img/2025/...
          const pagesUrl = `${origin}${matchPrefix}${relPath}`
          img.setAttribute('src', pagesUrl)
          img.setAttribute('data-cdn-src', proxyUrl) // 代理作为后备
        } else {
          // 没填域名，直接走代理
          img.setAttribute('src', proxyUrl)
        }
      }

      // 3. Pages 加载失败降级到 代理 CDN
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