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

  // 处理图片渲染（兼容网络图片、本地暂存图片、各种相对路径）
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

      // 1. 优先检查是不是属于“暂存的待上传图片”
      const pending = pendingImages.find(p => src.includes(p.id))
      if (pending) {
        img.setAttribute('src', `data:image/jpeg;base64,${pending.base64}`)
        img.removeAttribute('data-raw-src') // 防止触发 fallback
        return
      }

      // 2. 处理正常的网络相对路径
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        let fileName = src
        // 尝试匹配 /images/xxx 或者直接 xxx
        if (src.includes(imagePrefix)) {
          fileName = src.split(imagePrefix)[1]
        } else if (src.startsWith('/')) {
          fileName = src.substring(1) // 去掉开头的 /
        }

        // 组合出来真实的 GitHub Raw 地址
        const rawUrl = rawBase + imageDir + fileName
        if (pagesBase) {
          img.setAttribute('src', `${pagesBase}${imagePrefix}${fileName}`)
          img.setAttribute('data-raw-src', rawUrl)
        } else {
          img.setAttribute('src', rawUrl)
        }
      }

      // 3. 处理 fallback（Pages 加载失败切 Raw）
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
  }, [html, config, pendingImages]) // 确保 pendingImages 更新时重新执行替换

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