import { useEffect, useState } from 'react'
import { isPocketEdition } from '../lib/platform'

export interface ToolbarApi {
  insert: (text: string) => void
  wrap: (prefix: string, suffix: string, placeholder: string) => void
  focus: () => void
}

interface Props {
  api: () => ToolbarApi | null
}

interface Action {
  label: string
  title: string
  run: (api: ToolbarApi) => void
}

const MOBILE_ACTIONS: Action[] = [
  { label: 'B', title: '加粗', run: a => a.wrap('**', '**', '粗体') },
  { label: 'I', title: '斜体', run: a => a.wrap('*', '*', '斜体') },
  { label: 'S', title: '删除线', run: a => a.wrap('~~', '~~', '删除线') },
  { label: '`', title: '行内代码', run: a => a.wrap('`', '`', 'code') },
  { label: 'H2', title: '标题', run: a => a.insert('\n## ') },
  { label: '❝', title: '引用', run: a => a.insert('\n> ') },
  { label: '•', title: '无序列表', run: a => a.insert('\n- ') },
  { label: '1.', title: '有序列表', run: a => a.insert('\n1. ') },
  { label: '🔗', title: '链接', run: a => a.wrap('[', '](url)', '链接文字') },
  { label: '```', title: '代码块', run: a => a.insert('\n```\n\n```\n') },
  { label: '∑', title: '行内公式', run: a => a.wrap('$', '$', 'x^2') },
  { label: '⊞', title: '表格', run: a => a.insert('\n| 列1 | 列2 |\n| --- | --- |\n| 值 | 值 |\n') },
  { label: '─', title: '分割线', run: a => a.insert('\n---\n') },
  { label: '◇', title: 'Mermaid 图表', run: a => a.insert('\n```mermaid\ngraph TD\n  A[开始] --> B[结束]\n```\n') },
]

interface LatexSymbol {
  display: string
  command: string
  group: string
}

const LATEX_SYMBOLS: LatexSymbol[] = [
  // 希腊字母
  { display: 'α', command: '\\alpha', group: '希腊' },
  { display: 'β', command: '\\beta', group: '希腊' },
  { display: 'γ', command: '\\gamma', group: '希腊' },
  { display: 'δ', command: '\\delta', group: '希腊' },
  { display: 'ε', command: '\\epsilon', group: '希腊' },
  { display: 'ζ', command: '\\zeta', group: '希腊' },
  { display: 'η', command: '\\eta', group: '希腊' },
  { display: 'θ', command: '\\theta', group: '希腊' },
  { display: 'λ', command: '\\lambda', group: '希腊' },
  { display: 'μ', command: '\\mu', group: '希腊' },
  { display: 'ν', command: '\\nu', group: '希腊' },
  { display: 'ξ', command: '\\xi', group: '希腊' },
  { display: 'π', command: '\\pi', group: '希腊' },
  { display: 'ρ', command: '\\rho', group: '希腊' },
  { display: 'σ', command: '\\sigma', group: '希腊' },
  { display: 'τ', command: '\\tau', group: '希腊' },
  { display: 'φ', command: '\\phi', group: '希腊' },
  { display: 'χ', command: '\\chi', group: '希腊' },
  { display: 'ψ', command: '\\psi', group: '希腊' },
  { display: 'ω', command: '\\omega', group: '希腊' },
  { display: 'Γ', command: '\\Gamma', group: '希腊' },
  { display: 'Δ', command: '\\Delta', group: '希腊' },
  { display: 'Θ', command: '\\Theta', group: '希腊' },
  { display: 'Λ', command: '\\Lambda', group: '希腊' },
  { display: 'Σ', command: '\\Sigma', group: '希腊' },
  { display: 'Φ', command: '\\Phi', group: '希腊' },
  { display: 'Ψ', command: '\\Psi', group: '希腊' },
  { display: 'Ω', command: '\\Omega', group: '希腊' },
  // 运算符
  { display: '±', command: '\\pm', group: '运算' },
  { display: '∓', command: '\\mp', group: '运算' },
  { display: '×', command: '\\times', group: '运算' },
  { display: '÷', command: '\\div', group: '运算' },
  { display: '·', command: '\\cdot', group: '运算' },
  { display: '∑', command: '\\sum', group: '运算' },
  { display: '∏', command: '\\prod', group: '运算' },
  { display: '∫', command: '\\int', group: '运算' },
  { display: '∂', command: '\\partial', group: '运算' },
  { display: '∇', command: '\\nabla', group: '运算' },
  { display: '√', command: '\\sqrt{}', group: '运算' },
  { display: '∞', command: '\\infty', group: '运算' },
  { display: '!', command: '\\factorial', group: '运算' },
  // 关系
  { display: '≤', command: '\\leq', group: '关系' },
  { display: '≥', command: '\\geq', group: '关系' },
  { display: '≠', command: '\\neq', group: '关系' },
  { display: '≈', command: '\\approx', group: '关系' },
  { display: '≡', command: '\\equiv', group: '关系' },
  { display: '∝', command: '\\propto', group: '关系' },
  { display: '∈', command: '\\in', group: '关系' },
  { display: '∉', command: '\\notin', group: '关系' },
  { display: '⊂', command: '\\subset', group: '关系' },
  { display: '⊃', command: '\\supset', group: '关系' },
  { display: '⊆', command: '\\subseteq', group: '关系' },
  { display: '⊇', command: '\\supseteq', group: '关系' },
  { display: '∪', command: '\\cup', group: '关系' },
  { display: '∩', command: '\\cap', group: '关系' },
  { display: '∅', command: '\\emptyset', group: '关系' },
  // 箭头
  { display: '→', command: '\\rightarrow', group: '箭头' },
  { display: '←', command: '\\leftarrow', group: '箭头' },
  { display: '↔', command: '\\leftrightarrow', group: '箭头' },
  { display: '⇒', command: '\\Rightarrow', group: '箭头' },
  { display: '⇐', command: '\\Leftarrow', group: '箭头' },
  { display: '⇔', command: '\\Leftrightarrow', group: '箭头' },
  { display: '↑', command: '\\uparrow', group: '箭头' },
  { display: '↓', command: '\\downarrow', group: '箭头' },
  { display: '↦', command: '\\mapsto', group: '箭头' },
]

export default function EditorToolbar({ api }: Props) {
  if (isPocketEdition()) {
    return <MobileToolbar api={api} />
  }
  return <DesktopToolbar api={api} />
}

function MobileToolbar({ api }: Props) {
  const [showLatex, setShowLatex] = useState(false)
  const groups = Array.from(new Set(LATEX_SYMBOLS.map(s => s.group)))

  function safeRun(fn: () => void) {
    const tb = api()
    if (tb) {
      fn()
      // 保证操作完后光标不丢
      setTimeout(() => tb.focus(), 0)
    }
  }

  return (
    <div style={{ borderBottom: '1px solid #e0e0e0', background: '#fafafa', position: 'relative' }}>
      {/* 快捷按钮区 */}
      <div
        style={{
          display: 'flex', gap: 4, padding: '6px 8px', overflowX: 'auto',
          WebkitOverflowScrolling: 'touch', flexWrap: 'nowrap',
        }}
      >
        {MOBILE_ACTIONS.map(a => (
          <button
            key={a.title}
            title={a.title}
            onMouseDown={e => e.preventDefault()}
            onTouchStart={e => e.preventDefault()}
            onClick={() => safeRun(() => a.run(api()!))}
            style={toolbarBtn({
              bold: a.label === 'B',
              italic: a.label === 'I',
              mono: a.label.length <= 2 || a.label === '```',
            })}
          >
            {a.label}
          </button>
        ))}
        <button
          title="LaTeX 符号"
          onMouseDown={e => e.preventDefault()}
          onTouchStart={e => e.preventDefault()}
          onClick={() => setShowLatex(!showLatex)}
          style={{
            ...toolbarBtn({}),
            background: showLatex ? '#1976d2' : '#fff',
            color: showLatex ? '#fff' : '#333',
            fontWeight: 'bold',
          }}
        >
          ∑...
        </button>
      </div>

      {/* 移动端 LaTeX 抽屉 */}
      {showLatex && (
        <div style={{
          padding: '10px 12px', background: '#fff', borderTop: '1px solid #e0e0e0',
          maxHeight: '40vh', overflowY: 'auto', boxShadow: 'inset 0 4px 6px -4px rgba(0,0,0,0.1)'
        }}>
          {groups.map(group => (
            <div key={group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>
                {group}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: 6 }}>
                {LATEX_SYMBOLS.filter(s => s.group === group).map(s => (
                  <button
                    key={s.command}
                    onMouseDown={e => e.preventDefault()}
                    onTouchStart={e => e.preventDefault()}
                    onClick={() => {
                      safeRun(() => api()!.insert(s.command + ' '))
                      setShowLatex(false)
                    }}
                    style={{
                      height: 36, background: '#f5f5f5', border: '1px solid #ddd',
                      borderRadius: 6, fontSize: 16, color: '#333',
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

function DesktopToolbar({ api }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function insertCommand(command: string) {
    const tb = api()
    if (!tb) return
    tb.insert(command + ' ')
    tb.focus()
  }

  const groups = Array.from(new Set(LATEX_SYMBOLS.map(s => s.group)))

  return (
    <div style={{ borderBottom: '1px solid #e0e0e0', background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            padding: '6px 12px', background: open ? '#1976d2' : '#fff',
            color: open ? '#fff' : '#333',
            border: '1px solid ' + (open ? '#1976d2' : '#d0d0d0'),
            borderRadius: 6, fontSize: 13, cursor: 'pointer',
          }}
        >
          ∑ LaTeX 符号 {open ? '▴' : '▾'}
        </button>
        <span style={{ fontSize: 12, color: '#888' }}>
          点击插入命令，可直接用键盘继续编辑。Esc 关闭面板。
        </span>
      </div>

      {open && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #e0e0e0', maxHeight: '40vh', overflowY: 'auto' }}>
          {groups.map(group => (
            <div key={group} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4, fontWeight: 500 }}>{group}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 4 }}>
                {LATEX_SYMBOLS.filter(s => s.group === group).map(s => (
                  <button
                    key={s.command}
                    onClick={() => insertCommand(s.command)}
                    title={`${s.display}  →  ${s.command}`}
                    style={{
                      height: 34, background: '#fff', border: '1px solid #e0e0e0',
                      borderRadius: 6, fontSize: 16, cursor: 'pointer', color: '#333',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#f5f5f5'
                      e.currentTarget.style.borderColor = '#1976d2'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#fff'
                      e.currentTarget.style.borderColor = '#e0e0e0'
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

function toolbarBtn(opts: { bold?: boolean; italic?: boolean; mono?: boolean }): React.CSSProperties {
  return {
    flex: '0 0 auto', minWidth: 34, height: 32, padding: '0 8px',
    background: '#fff', border: '1px solid #d0d0d0', borderRadius: 6,
    fontSize: 13, fontFamily: opts.mono ? 'ui-monospace, monospace' : 'inherit',
    fontWeight: opts.bold ? 700 : 400, fontStyle: opts.italic ? 'italic' : 'normal',
    cursor: 'pointer', color: '#333',
  }
}