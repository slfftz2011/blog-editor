import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

interface Props {
  value: string
  onChange: (v: string) => void
  onReady?: (api: EditorApi) => void
}

export interface EditorApi {
  insert: (text: string) => void
  wrap: (prefix: string, suffix: string, placeholder: string) => void
  focus: () => void
}

/**
 * 用稳定类名映射 markdown 语法，颜色全部交给 CSS 变量，
 * 这样切换深浅色时编辑器不需要重建。
 */
const mdHighlight = HighlightStyle.define([
  { tag: t.heading, class: 'cm-md-heading' },
  { tag: t.strong, class: 'cm-md-strong' },
  { tag: t.emphasis, class: 'cm-md-em' },
  { tag: t.strikethrough, class: 'cm-md-strike' },
  { tag: t.link, class: 'cm-md-link' },
  { tag: t.url, class: 'cm-md-url' },
  { tag: t.monospace, class: 'cm-md-mono' },
  { tag: t.quote, class: 'cm-md-quote' },
  { tag: t.processingInstruction, class: 'cm-md-punct' },
  { tag: t.contentSeparator, class: 'cm-md-hr' },
  { tag: t.meta, class: 'cm-md-meta' },
  { tag: t.keyword, class: 'cm-md-keyword' },
  { tag: t.string, class: 'cm-md-string' },
  { tag: t.number, class: 'cm-md-number' },
  { tag: t.comment, class: 'cm-md-comment' },
])

export default function MarkdownEditor({ value, onChange, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!ref.current) return
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.lineWrapping,
          syntaxHighlighting(mdHighlight),
          // 只放必须动态生效的，其余全交给 editor.css
          EditorView.theme({
            '&': { height: '100%' },
            '&.cm-focused': { outline: 'none' },
          }),
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString())
            }
          }),
        ],
      }),
      parent: ref.current,
    })
    viewRef.current = view

    onReady?.({
      insert: text => view.dispatch(view.state.replaceSelection(text)),
      wrap: (prefix, suffix, placeholder) => {
        const { from, to } = view.state.selection.main
        const selected = view.state.sliceDoc(from, to)
        const text = selected || placeholder
        const insert = prefix + text + suffix
        view.dispatch({
          changes: { from, to, insert },
          selection: {
            anchor: from + prefix.length,
            head: from + prefix.length + text.length,
          },
        })
      },
      focus: () => view.focus(),
    })

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (view.state.doc.toString() !== value) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      })
    }
  }, [value])

  return <div ref={ref} style={{ height: '100%', overflow: 'hidden' }} />
}