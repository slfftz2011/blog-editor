import { useMemo } from 'react'
import { md } from '../lib/markdown'

interface Props {
  content: string
}

export default function MarkdownPreview({ content }: Props) {
  const html = useMemo(() => md.render(content), [content])
  return (
    <div
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