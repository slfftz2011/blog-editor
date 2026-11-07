import { useEffect, useState } from 'react'
import { isPocketEdition } from '../lib/platform'
import { LATEX_SYMBOLS, EXTRA_SYMBOLS } from '../lib/symbols'

export interface ToolbarApi {
  insert: (text: string) => void
  wrap: (prefix: string, suffix: string, placeholder: string) => void
  toggleHeading: () => void
  moveCursor: (dir: 'left' | 'right' | 'up' | 'down', select: boolean) => void
  insertTab: () => void
  focus: () => void
}

interface Props {
  api: () => ToolbarApi | null
}

interface Action {
  label: string
  title: string
  variant?: 'bold' | 'italic' | 'mono'
  run: (api: ToolbarApi) => void
}

// 这里把 H2 变成了调用 toggleHeading()
const ACTIONS: Action[] = [
  { label: 'B', title: '加粗', variant: 'bold', run: a => a.wrap('**', '**', '粗体') },
  { label: 'I', title: '斜体', variant: 'italic', run: a => a.wrap('*', '*', '斜体') },
  { label: 'S', title: '删除线', run: a => a.wrap('~~', '~~', '删除线') },
  { label: '`', title: '行内代码', variant: 'mono', run: a => a.wrap('`', '`', 'code') },
  { label: 'H', title: '标题递增', run: a => a.toggleHeading() },
  { label: '❝', title: '引用', run: a => a.insert('\n> ') },
  { label: '•', title: '无序列表', run: a => a.insert('\n- ') },
  { label: '1.', title: '有序列表', variant: 'mono', run: a => a.insert('\n1. ') },
  { label: '🔗', title: '链接', run: a => a.wrap('[', '](url)', '链接文字') },
  { label: '```', title: '代码块', variant: 'mono', run: a => a.insert('\n```\n\n```\n') },
  { label: '∑', title: '行内公式', run: a => a.wrap('$', '$', 'x^2') },
  { label: '⊞', title: '表格', run: a => a.insert('\n| 列1 | 列2 |\n| --- | --- |\n| 值 | 值 |\n') },
  { label: '─', title: '分割线', run: a => a.insert('\n---\n') },
  { label: '◇', title: 'Mermaid 图表', run: a => a.insert('\n```mermaid\ngraph TD\n  A[开始] --> B[结束]\n```\n') },
]

const GROUPS = Array.from(new Set(LATEX_SYMBOLS.map(s => s.group)))

export default function EditorToolbar({ api }: Props) {
  if (isPocketEdition()) {
    return <MobileToolbar api={api} />
  }
  return <DesktopToolbar api={api} />
}

// ================= 公共方法 =================
function useSafeRun(api: () => ToolbarApi | null) {
  return (fn: (a: ToolbarApi) => void) => {
    const tb = api()
    if (!tb) return
    fn(tb)
    // 工具栏按钮会抢焦点，操作后把光标还给编辑器
    setTimeout(() => tb.focus(), 0)
  }
}

function preventBlur(e: React.SyntheticEvent) {
  e.preventDefault()
}

function btnClass(a: Action) {
  return [
    'toolbar__btn',
    a.variant === 'bold' && 'toolbar__btn--bold',
    a.variant === 'italic' && 'toolbar__btn--italic',
    a.variant === 'mono' && 'toolbar__btn--mono',
  ].filter(Boolean).join(' ')
}

// ================= 桌面端 =================
function DesktopToolbar({ api }: Props) {
  const [showLatex, setShowLatex] = useState(false)
  const safeRun = useSafeRun(api)

  useEffect(() => {
    if (!showLatex) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowLatex(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showLatex])

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        {ACTIONS.map(a => (
          <button
            key={a.title}
            type="button"
            className={btnClass(a)}
            title={a.title}
            aria-label={a.title}
            onMouseDown={preventBlur}
            onTouchStart={preventBlur}
            onClick={() => safeRun(a.run)}
          >
            {a.label}
          </button>
        ))}
        <div className="toolbar__divider" />
        <button
          type="button"
          className={`toolbar__btn toolbar__btn--mono${showLatex ? ' is-active' : ''}`}
          title="LaTeX 符号"
          aria-label="LaTeX 符号"
          aria-expanded={showLatex}
          onMouseDown={preventBlur}
          onTouchStart={preventBlur}
          onClick={() => setShowLatex(v => !v)}
        >
          ∑…
        </button>
      </div>

      {showLatex && (
        <div className="latex-drawer">
          {GROUPS.map(group => (
            <div key={group} className="latex-group">
              <div className="latex-group__label">{group}</div>
              <div className="latex-grid">
                {LATEX_SYMBOLS.filter(s => s.group === group).map(s => (
                  <button
                    key={s.command}
                    type="button"
                    className="latex-symbol"
                    title={`${s.display}  →  ${s.command}`}
                    onMouseDown={preventBlur}
                    onTouchStart={preventBlur}
                    onClick={() => {
                      safeRun(a => a.insert(s.command + ' '))
                      setShowLatex(false)
                    }}
                  >
                    {s.display}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ================= 移动端 (PE) =================
function MobileToolbar({ api }: Props) {
  const [showLatex, setShowLatex] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  const safeRun = useSafeRun(api)

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        {ACTIONS.map(a => (
          <button
            key={a.title}
            type="button"
            className={btnClass(a)}
            title={a.title}
            aria-label={a.title}
            onMouseDown={preventBlur}
            onTouchStart={preventBlur}
            onClick={() => safeRun(a.run)}
          >
            {a.label}
          </button>
        ))}
        <div className="toolbar__divider" />
        <button
          type="button"
          className={`toolbar__btn toolbar__btn--mono${showLatex ? ' is-active' : ''}`}
          title="LaTeX 符号"
          aria-label="LaTeX 符号"
          aria-expanded={showLatex}
          onMouseDown={preventBlur}
          onTouchStart={preventBlur}
          onClick={() => { setShowLatex(v => !v); setShowKeys(false) }}
        >
          ∑…
        </button>
        <button
          type="button"
          className={`toolbar__btn${showKeys ? ' is-active' : ''}`}
          title="扩展按键"
          aria-label="扩展按键"
          aria-expanded={showKeys}
          onMouseDown={preventBlur}
          onTouchStart={preventBlur}
          onClick={() => { setShowKeys(v => !v); setShowLatex(false) }}
        >
          ⌨️
        </button>
      </div>

      {/* LaTeX 符号面板 */}
      {showLatex && (
        <div className="latex-drawer">
          {GROUPS.map(group => (
            <div key={group} className="latex-group">
              <div className="latex-group__label">{group}</div>
              <div className="latex-grid">
                {LATEX_SYMBOLS.filter(s => s.group === group).map(s => (
                  <button
                    key={s.command}
                    type="button"
                    className="latex-symbol"
                    title={`${s.display}  →  ${s.command}`}
                    onMouseDown={preventBlur}
                    onTouchStart={preventBlur}
                    onClick={() => {
                      safeRun(a => a.insert(s.command + ' '))
                      setShowLatex(false)
                    }}
                  >
                    {s.display}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 扩展按键面板 */}
      {showKeys && (
        <div className="latex-drawer">
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <ActionKey label="Tab" onClick={() => safeRun(a => a.insertTab())} />
            <ActionKey label="←" onClick={() => safeRun(a => a.moveCursor('left', false))} />
            <ActionKey label="→" onClick={() => safeRun(a => a.moveCursor('right', false))} />
            <ActionKey label="↑" onClick={() => safeRun(a => a.moveCursor('up', false))} />
            <ActionKey label="↓" onClick={() => safeRun(a => a.moveCursor('down', false))} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <ActionKey label="← 选中" onClick={() => safeRun(a => a.moveCursor('left', true))} />
            <ActionKey label="选中 →" onClick={() => safeRun(a => a.moveCursor('right', true))} />
            <ActionKey label="↑ 选中" onClick={() => safeRun(a => a.moveCursor('up', true))} />
            <ActionKey label="选中 ↓" onClick={() => safeRun(a => a.moveCursor('down', true))} />
          </div>
          <div className="latex-grid" style={{ borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
            {EXTRA_SYMBOLS.map(s => (
              <button 
                key={s} 
                className="latex-symbol" 
                onMouseDown={preventBlur}
                onTouchStart={preventBlur}
                onClick={() => safeRun(a => a.insert(s))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 扩展按键的封装
function ActionKey({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="toolbar__btn"
      style={{ flex: 1, background: 'var(--surface-hover)' }}
      onMouseDown={preventBlur}
      onTouchStart={preventBlur}
      onClick={onClick}
    >
      {label}
    </button>
  )
}