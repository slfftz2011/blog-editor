interface Draft {
    content: string
    savedAt: number
    isNew: boolean
  }
  
  const PREFIX = 'draft:'
  const TTL = 7 * 24 * 60 * 60 * 1000 // 7 天后过期
  
  const key = (path: string) => PREFIX + path
  
  export function saveDraft(path: string, content: string, isNew: boolean): void {
    try {
      localStorage.setItem(
        key(path),
        JSON.stringify({ content, savedAt: Date.now(), isNew }),
      )
    } catch {
      // localStorage 满了就静默失败，不阻塞编辑
    }
  }
  
  export function loadDraft(path: string): Draft | null {
    try {
      const raw = localStorage.getItem(key(path))
      if (!raw) return null
      const d = JSON.parse(raw) as Draft
      if (Date.now() - d.savedAt > TTL) {
        localStorage.removeItem(key(path))
        return null
      }
      return d
    } catch {
      return null
    }
  }
  
  export function clearDraft(path: string): void {
    localStorage.removeItem(key(path))
  }