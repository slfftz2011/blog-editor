import { useEffect, useMemo, useRef } from 'react'
import mermaid from 'mermaid'
import type { RepoConfig } from '../types'
import { createMarkdown } from '../lib/markdown'
import { useTheme } from '../lib/theme'

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })
let mermaidCounter = 0

interface Props {
  config: RepoConfig
  content: string
  pendingImages?: { id: string, base64: string }[]
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default function MarkdownPreview({ config, content }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const html = useMemo(() => createMarkdown(config).render(content), [config, content])
  const [theme] = useTheme()

  // 图片处理（Markdown 与纯 HTML 标签都覆盖）
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
      
      // 1. 优先检查是不是暂存图片
      const pendingImg = pendingImages?.find(p => src.includes(p.id))
      if (pendingImg) {
        img.setAttribute('src', `data:image/jpeg;base64,${pendingImg.base64}`)
        return // 跳过后续网络请求
      }

      // 2. 处理正常的远端图片
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        // 规范化路径：去掉开头的 ./ 或 /
        const cleanSrc = src.replace(/^\.?\//, '')
        
        // 如果是以 imageDir 的目录名开头（例如 images/xxx.jpg）
        // 或者如果配置了 imageUrlPrefix 并且匹配
        let fileName = cleanSrc
        if (cleanSrc.startsWith('images/')) {
           fileName = cleanSrc.replace('images/', '')
        } else if (cleanSrc.startsWith(imageDir)) {
           fileName = cleanSrc.replace(imageDir, '')
        }

        // 拼装 Raw URL
        const rawUrl = rawBase + imageDir + fileName
        if (pagesBase) {
          img.setAttribute('src', pagesBase + '/' + imageDir + fileName)
          img.setAttribute('data-raw-src', rawUrl)
        } else {
          img.setAttribute('src', rawUrl)
        }
      }

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

  // Mermaid 渲染（依赖 theme，切换主题时重新渲染）
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const nodes = root.querySelectorAll<HTMLElement>('.mermaid')
    if (nodes.length === 0) return

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: theme === 'dark' ? 'dark' : 'default',
    })

    let cancelled = false
    ;(async () => {
      for (const node of Array.from(nodes)) {
        if (cancelled) return

        // 首次渲染保存原始代码，主题切换时复用
        if (!node.hasAttribute('data-source')) {
          node.setAttribute('data-source', node.textContent ?? '')
        }
        const code = node.getAttribute('data-source') ?? ''
        if (!code.trim()) continue

        const id = `mmd-${++mermaidCounter}`
        try {
          const { svg } = await mermaid.render(id, code)
          if (!cancelled) node.innerHTML = svg
        } catch (e: any) {
          if (!cancelled) {
            node.innerHTML = `<pre class="mermaid-error">Mermaid 错误: ${escapeHtml(
              e?.message ?? String(e)
            )}</pre>`
          }
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [html, theme])

  return (
    <div className="preview-scroll">
      <div
        ref={ref}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}