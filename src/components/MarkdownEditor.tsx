import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, EditorSelection } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { 
  cursorCharLeft, cursorCharRight, cursorLineUp, cursorLineDown,
  selectCharLeft, selectCharRight, selectLineUp, selectLineDown,
  indentMore 
} from '@codemirror/commands'

interface Props {
  value: string
  onChange: (v: string) => void
  onReady?: (api: EditorApi) => void
}

export interface EditorApi {
  insert: (text: string) => void
  wrap: (prefix: string, suffix: string, placeholder: string) => void
  toggleHeading: () => void
  moveCursor: (dir: 'left' | 'right' | 'up' | 'down', select: boolean) => void
  insertTab: () => void
  focus: () => void
}

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
          EditorView.theme({
            '&': { height: '100%', fontSize: '15px' },
            '.cm-scroller': { overflow: 'auto' },
            '.cm-content': { fontFamily: 'ui-monospace, Menlo, monospace' },
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
      insert: text => {
        view.dispatch(view.state.replaceSelection(text))
        view.focus()
      },
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
        view.focus()
      },
      toggleHeading: () => {
        const line = view.state.doc.lineAt(view.state.selection.main.head)
        const text = line.text
        const match = text.match(/^(#{1,5})\s/)
        let newPrefix = '# '
        if (match) {
          newPrefix = '#'.repeat(match[1].length + 1) + ' '
        }
        const newText = match 
          ? newPrefix + text.slice(match[0].length) 
          : newPrefix + text
        
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: newText },
          selection: { anchor: line.from + newPrefix.length }
        })
        view.focus()
      },
      moveCursor: (dir, select) => {
        let cmd
        if (select) {
          cmd = dir === 'left' ? selectCharLeft 
              : dir === 'right' ? selectCharRight
              : dir === 'up' ? selectLineUp 
              : selectLineDown
        } else {
          cmd = dir === 'left' ? cursorCharLeft 
              : dir === 'right' ? cursorCharRight
              : dir === 'up' ? cursorLineUp 
              : cursorLineDown
        }
        cmd(view)
        view.focus()
      },
      insertTab: () => {
        indentMore(view)
        view.focus()
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