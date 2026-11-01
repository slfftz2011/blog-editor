import { useEffect, useState } from 'react'

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
  variant?: 'bold' | 'italic' | 'mono'
  run: (api: ToolbarApi) => void
}

const ACTIONS: Action[] = [
  { label: 'B', title: '加粗', variant: 'bold', run: a => a.wrap('**', '**', '粗体') },
  { label: 'I', title: '斜体', variant: 'italic', run: a => a.wrap('*', '*', '斜体') },
  { label: 'S', title: '删除线', run: a => a.wrap('~~', '~~', '删除线') },
  { label: '`', title: '行内代码', variant: 'mono', run: a => a.wrap('`', '`', 'code') },
  { label: 'H2', title: '标题', run: a => a.insert('\n## ') },
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

interface LatexSymbol {
  display: string
  command: string
  group: string
}

const LATEX_SYMBOLS: LatexSymbol[] = [
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

const GROUPS = Array.from(new Set(LATEX_SYMBOLS.map(s => s.group)))

export default function EditorToolbar({ api }: Props) {
  const [showLatex, setShowLatex] = useState(false)

  useEffect(() => {
    if (!showLatex) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowLatex(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showLatex])

  function safeRun(fn: (a: ToolbarApi) => void) {
    const tb = api()
    if (!tb) return
    fn(tb)
    // 工具栏按钮会抢焦点，操作后把光标还给编辑器
    setTimeout(() => tb.focus(), 0)
  }

  function btnClass(a: Action) {
    return [
      'toolbar__btn',
      a.variant === 'bold' && 'toolbar__btn--bold',
      a.variant === 'italic' && 'toolbar__btn--italic',
      a.variant === 'mono' && 'toolbar__btn--mono',
    ]
      .filter(Boolean)
      .join(' ')
  }

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
            onMouseDown={e => e.preventDefault()}
            onTouchStart={e => e.preventDefault()}
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
          onMouseDown={e => e.preventDefault()}
          onTouchStart={e => e.preventDefault()}
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
                    onMouseDown={e => e.preventDefault()}
                    onTouchStart={e => e.preventDefault()}
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