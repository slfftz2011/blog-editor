export interface ThemeOption {
  id: string
  name: string
  repo: string
  branch?: string // 👈 新增
  configFile?: string
}

export const THEME_MARKET: ThemeOption[] = [
  { id: 'landscape', name: 'Landscape (默认)', repo: '' },
  { id: 'butterfly', name: 'Butterfly', repo: 'jerryc127/hexo-theme-butterfly', branch: 'master', configFile: '_config.butterfly.yml' },
  { id: 'fluid', name: 'Fluid', repo: 'fluid-dev/hexo-theme-fluid', branch: 'master', configFile: '_config.fluid.yml' },
  { id: 'next', name: 'NexT', repo: 'next-theme/hexo-theme-next', branch: 'master', configFile: '_config.next.yml' },
  { id: 'volantis', name: 'Volantis', repo: 'volantis-x/hexo-theme-volantis', branch: 'master', configFile: '_config.volantis.yml' },
]