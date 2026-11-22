export interface ThemeOption {
    id: string
    name: string
    repo: string
    configFile?: string
  }
  
  export const THEME_MARKET: ThemeOption[] = [
    { id: 'landscape', name: 'Landscape (默认)', repo: '' },
    { id: 'butterfly', name: 'Butterfly', repo: 'jerryc127/hexo-theme-butterfly', configFile: '_config.butterfly.yml' },
    { id: 'fluid', name: 'Fluid', repo: 'fluid-dev/hexo-theme-fluid', configFile: '_config.fluid.yml' },
    { id: 'next', name: 'NexT', repo: 'next-theme/hexo-theme-next', configFile: '_config.next.yml' },
    { id: 'volantis', name: 'Volantis', repo: 'volantis-x/hexo-theme-volantis', configFile: '_config.volantis.yml' },
  ]