export interface LatexSymbol {
    display: string
    command: string
    group: string
  }
  
  // 完整的 LaTeX 符号表
  export const LATEX_SYMBOLS: LatexSymbol[] = [
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
  
    // 其他
    { display: '…', command: '\\cdots', group: '其他' },
    { display: '⋮', command: '\\vdots', group: '其他' },
    { display: '∠', command: '\\angle', group: '其他' },
    { display: '⊥', command: '\\perp', group: '其他' },
    { display: '∥', command: '\\parallel', group: '其他' },
    { display: 'ℏ', command: '\\hbar', group: '其他' },
    { display: '°', command: '\\degree', group: '其他' },
    { display: '△', command: '\\triangle', group: '其他' },
    { display: '□', command: '\\square', group: '其他' },
  ]
  
  // 手机键盘难打、但在写代码/Markdown 时常用的符号
  export const EXTRA_SYMBOLS = [
    '{', '}', '[', ']', '<', '>', '|', '\\', '`', // 代码与 Markdown 核心
    '~', '^', '...', '——', '「', '」', '『', '』', // 特殊中文排版与补充
    '×', '÷', '±', '≈', '≠', '≤', '≥', '√', '∑', '∞', 'π', '°' // 常用数学
  ]