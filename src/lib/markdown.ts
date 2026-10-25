import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import katex from 'katex'
import 'katex/contrib/mhchem'
import type { RepoConfig } from '../types'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderMath(src: string, displayMode: boolean): string {
  try {
    return katex.renderToString(src, {
      displayMode,
      throwOnError: false,
      trust: true,
      strict: false,
      output: 'html',
    })
  } catch (e: any) {
    return `<span class="katex-error" style="color:#c62828">[公式错误] ${escapeHtml(
      String(e.message),
    )}</span>`
  }
}

function installMath(md: MarkdownIt) {
  // 块级 $$...$$
  md.block.ruler.before(
    'fence',
    'math_block',
    (
      state: any,
      startLine: number,
      endLine: number,
      silent: boolean,
    ) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const line = state.src.slice(pos, max)
      if (!line.startsWith('$$')) return false

      // 单行 $$...$$
      if (line.length > 4 && line.endsWith('$$')) {
        if (silent) return true
        const content = line.slice(2, -2).trim()
        const token = state.push('math_block', 'math', 0)
        token.content = content
        token.markup = '$$'
        state.line = startLine + 1
        return true
      }

      // 多行
      let nextLine = startLine + 1
      let content = line.slice(2) + '\n'
      let found = false
      while (nextLine < endLine) {
        const ls = state.bMarks[nextLine] + state.tShift[nextLine]
        const le = state.eMarks[nextLine]
        const lstr = state.src.slice(ls, le)
        if (lstr.trim().endsWith('$$')) {
          content += lstr.trim().slice(0, -2)
          found = true
          break
        }
        content += lstr + '\n'
        nextLine++
      }
      if (!found) return false
      if (silent) return true
      const token = state.push('math_block', 'math', 0)
      token.content = content.trim()
      token.markup = '$$'
      state.line = nextLine + 1
      return true
    },
    { alt: ['paragraph', 'reference', 'blockquote', 'list'] },
  )

  md.renderer.rules.math_block = (tokens: any[], idx: number) =>
    `<div class="math-block">${renderMath(tokens[idx].content, true)}</div>`

  // 行内 $...$
  md.inline.ruler.after(
    'escape',
    'math_inline',
    (state: any, silent: boolean) => {
      const start = state.pos
      if (state.src[start] !== '$') return false
      if (state.src[start + 1] === '$') return false
      let pos = start + 1
      let found = false
      while (pos < state.posMax) {
        const ch = state.src[pos]
        if (ch === '\\') {
          pos += 2
          continue
        }
        if (ch === '$') {
          found = true
          break
        }
        pos++
      }
      if (!found) return false
      const content = state.src.slice(start + 1, pos)
      if (!content.trim()) return false
      if (silent) return true
      const token = state.push('math_inline', 'math', 0)
      token.content = content
      token.markup = '$'
      state.pos = pos + 1
      return true
    },
  )

  md.renderer.rules.math_inline = (tokens: any[], idx: number) =>
    renderMath(tokens[idx].content, false)
}

export function createMarkdown(cfg: RepoConfig): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
    typographer: false,
  })

  installMath(md)

  // mermaid 代码块：包一层 div 交给前端渲染
  const defaultFence =
  md.renderer.rules.fence ??
  ((tokens: Token[], idx: number, options: any, _env: any, self: any) =>
    self.renderToken(tokens, idx, options))

  md.renderer.rules.fence = (
    tokens: Token[],
    idx: number,
    options: any,
    env: any,
    self: any,
  ) => {
    const token = tokens[idx]
    if (token.info.trim() === 'mermaid') {
      return `<div class="mermaid">${escapeHtml(token.content)}</div>`
    }
    return defaultFence(tokens, idx, options, env, self)
  }

  // 图片：Pages 优先 + raw fallback
  const imagePrefix = cfg.imageUrlPrefix.replace(/\/+$/, '') + '/'
  const imageDir = cfg.imageDir.replace(/\/+$/, '') + '/'
  const rawBase = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/`
  const pagesBase = cfg.pagesBaseUrl.trim().replace(/\/+$/, '')

  const defaultImage =
    md.renderer.rules.image ??
    ((tokens: Token[], idx: number, options: any, _env: any, self: any) =>
      self.renderToken(tokens, idx, options))

  md.renderer.rules.image = (
    tokens: Token[],
    idx: number,
    options: any,
    env: any,
    self: any,
  ) => {
    const token = tokens[idx]
    const src = token.attrGet('src') ?? ''
    if (src.startsWith(imagePrefix)) {
      const fileName = src.substring(imagePrefix.length)
      const rawUrl = rawBase + imageDir + fileName
      if (pagesBase) {
        token.attrSet('src', pagesBase + imagePrefix + fileName)
        token.attrSet('data-raw-src', rawUrl)
      } else {
        token.attrSet('src', rawUrl)
      }
    }
    return defaultImage(tokens, idx, options, env, self)
  }

  return md
}