import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type { Renderer } from 'markdown-it'
import type { RepoConfig } from '../types'

export function createMarkdown(cfg: RepoConfig): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
    typographer: false,
  })

  const imagePrefix = cfg.imageUrlPrefix.replace(/\/+$/, '') + '/'
  const imageDir = cfg.imageDir.replace(/\/+$/, '') + '/'
  const rawBase = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/`
  const pagesBase = cfg.pagesBaseUrl.trim().replace(/\/+$/, '')

  const defaultImage: Renderer.RenderRule =
    md.renderer.rules.image ??
    ((tokens, idx, options, _env, self) =>
      self.renderToken(tokens, idx, options))

  md.renderer.rules.image = (
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: any,
    self: Renderer,
  ) => {
    const token = tokens[idx]
    const src = token.attrGet('src') ?? ''

    if (src.startsWith(imagePrefix)) {
      const fileName = src.substring(imagePrefix.length)
      const rawUrl = rawBase + imageDir + fileName

      if (pagesBase) {
        const pagesUrl = pagesBase + imagePrefix + fileName
        token.attrSet('src', pagesUrl)
        token.attrSet('data-raw-src', rawUrl)
      } else {
        token.attrSet('src', rawUrl)
      }
    }

    return defaultImage(tokens, idx, options, env, self)
  }

  return md
}