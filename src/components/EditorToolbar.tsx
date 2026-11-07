import { useState } from 'react'
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

export default function EditorToolbar({ api }: Props) {
  if (isPocketEdition()) {
    return <MobileToolbar api={api} />
  }
  return <div style={{ padding: 8, color: '#666', fontSize: 13 }}>桌面端请直接使用键盘输入</div>
}

function MobileToolbar({ api }: Props) {
  const [showLatex, setShowLatex] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  function safeRun(fn: (tb: ToolbarApi) => void) {
    const tb = api()
    if (tb) {
      fn(tb)
      setTimeout(() => tb.focus(), 0)
    }
  }

  function preventBlur(e: React.SyntheticEvent) {
    e.preventDefault() // 防止键盘收起
  }

  const latexGroups = Array.from(new Set(LATEX_SYMBOLS.map(s => s.group)))

  return (
    <div style={{ borderBottom: '1px solid #e0e0e0', background: '#fafafa', position: 'relative' }}>
      {/* 主工具栏 */}
      <div style={{ display: 'flex', gap: 4, padding: '6px 8px', overflowX: 'auto', flexWrap: 'nowrap' }}>
        <TBtn label="B" title="加粗" bold onPointerDown={preventBlur} onClick={() => safeRun(t => t.wrap('**', '**', '粗体'))} />
        <TBtn label="I" title="斜体" italic onPointerDown={preventBlur} onClick={() => safeRun(t => t.wrap('*', '*', '斜体'))} />
        <TBtn label="H" title="标题递增" bold onPointerDown={preventBlur} onClick={() => safeRun(t => t.toggleHeading())} />
        <TBtn label="•" title="无序列表" onPointerDown={preventBlur} onClick={() => safeRun(t => t.insert('\n- '))} />
        <TBtn label="❝" title="引用" onPointerDown={preventBlur} onClick={() => safeRun(t => t.insert('\n> '))} />
        <TBtn label="`" title="行内代码/代码块" mono onPointerDown={preventBlur} onClick={() => safeRun(t => t.wrap('`', '`', 'code'))} />
        <TBtn label="🔗" title="链接" onPointerDown={preventBlur} onClick={() => safeRun(t => t.wrap('[', '](url)', '文字'))} />
        <TBtn label="∑" title="行内公式" onPointerDown={preventBlur} onClick={() => safeRun(t => t.wrap('$', '$', 'x^2'))} />
        <TBtn label="⊞" title="表格" onPointerDown={preventBlur} onClick={() => safeRun(t => t.insert('\n| 列1 | 列2 |\n| --- | --- |\n| 值 | 值 |\n'))} />
        <TBtn label="◇" title="Mermaid" onPointerDown={preventBlur} onClick={() => safeRun(t => t.insert('\n```mermaid\ngraph TD\n  A-->B\n```\n'))} />
        
        <TBtn 
          label="∑..." title="LaTeX 符号" 
          onPointerDown={preventBlur} 
          onClick={() => { setShowLatex(!showLatex); setShowKeys(false) }}
          active={showLatex}
        />
        <TBtn 
          label="⌨️" title="扩展按键与标点" 
          onPointerDown={preventBlur} 
          onClick={() => { setShowKeys(!showKeys); setShowLatex(false) }}
          active={showKeys}
        />
      </div>

      {/* 1. LaTeX 符号完整面板 */}
      {showLatex && (
        <div style={{ padding: '8px 12px', background: '#fff', borderTop: '1px solid #e0e0e0', maxHeight: '40vh', overflowY: 'auto' }}>
          {latexGroups.map(group => (
            <div key={group} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>{group}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: 6 }}>
                {LATEX_SYMBOLS.filter(s => s.group === group).map(s => (
                  <button
                    key={s.command} onPointerDown={preventBlur}
                    onClick={() => { safeRun(t => t.insert(s.command + ' ')); setShowLatex(false) }}
                    style={SymBtn}
                  >
                    {s.display}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. 扩展按键与补充符号面板 */}
      {showKeys && (
        <div style={{ padding: 8, background: '#fff', borderTop: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 光标移动与选中 */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            <ActionKey label="Tab" onPointerDown={preventBlur} onClick={() => safeRun(t => t.insertTab())} />
            <ActionKey label="←" onPointerDown={preventBlur} onClick={() => safeRun(t => t.moveCursor('left', false))} />
            <ActionKey label="→" onPointerDown={preventBlur} onClick={() => safeRun(t => t.moveCursor('right', false))} />
            <ActionKey label="↑" onPointerDown={preventBlur} onClick={() => safeRun(t => t.moveCursor('up', false))} />
            <ActionKey label="↓" onPointerDown={preventBlur} onClick={() => safeRun(t => t.moveCursor('down', false))} />
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            <ActionKey label="← 选中" onPointerDown={preventBlur} onClick={() => safeRun(t => t.moveCursor('left', true))} />
            <ActionKey label="选中 →" onPointerDown={preventBlur} onClick={() => safeRun(t => t.moveCursor('right', true))} />
            <ActionKey label="↑ 选中" onPointerDown={preventBlur} onClick={() => safeRun(t => t.moveCursor('up', true))} />
            <ActionKey label="选中 ↓" onPointerDown={preventBlur} onClick={() => safeRun(t => t.moveCursor('down', true))} />
          </div>
          {/* 难打符号面板 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: 6, borderTop: '1px dashed #ccc', paddingTop: 8 }}>
            {EXTRA_SYMBOLS.map(s => (
              <button key={s} onPointerDown={preventBlur} onClick={() => safeRun(t => t.insert(s))} style={SymBtn}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TBtn({ label, title, onClick, onPointerDown, bold, italic, mono, active }: any) {
  return (
    <button
      title={title} onPointerDown={onPointerDown} onClick={onClick}
      style={{
        flex: '0 0 auto', minWidth: 34, height: 32, padding: '0 8px',
        background: active ? '#1976d2' : '#fff', color: active ? '#fff' : '#333',
        border: '1px solid ' + (active ? '#1976d2' : '#d0d0d0'), borderRadius: 6,
        fontSize: 13, fontFamily: mono ? 'monospace' : 'inherit',
        fontWeight: bold ? 700 : 400, fontStyle: italic ? 'italic' : 'normal',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function ActionKey({ label, onClick, onPointerDown }: any) {
  return (
    <button
      onPointerDown={onPointerDown} onClick={onClick}
      style={{
        flex: 1, height: 34, background: '#f0f0f0', border: '1px solid #d0d0d0',
        borderRadius: 6, fontSize: 13, color: '#333', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

const SymBtn: React.CSSProperties = {
  height: 34, background: '#f5f5f5', border: '1px solid #ddd',
  borderRadius: 6, fontSize: 16, color: '#333', cursor: 'pointer',
}