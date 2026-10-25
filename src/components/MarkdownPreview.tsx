import { useEffect, useMemo, useRef } from 'react'
import type { RepoConfig } from '../types'
import { createMarkdown } from '../lib/markdown'

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

      // 如果 DOM 插入时已经加载失败（缓存/404 同步错误），手动触发一次
      if (img.complete && img.naturalWidth === 0) {
        fn()
      }
    })

    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener('error', fn))
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