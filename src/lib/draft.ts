export interface DraftItem {
    path: string
    content: string
    savedAt: number
    isNew: boolean
    expiresAt: number
  }
  
  interface Draft {
    content: string
    savedAt: number
    isNew: boolean
  }
  
  const PREFIX = 'draft:'
  const TTL = 7 * 24 * 60 * 60 * 1000
  
  const key = (path: string) => PREFIX + path
  
  export function saveDraft(path: string, content: string, isNew: boolean): void {
    try {
      localStorage.setItem(
        key(path),
        JSON.stringify({ content, savedAt: Date.now(), isNew }),
      )
    } catch {}
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
  
  export function listDrafts(): DraftItem[] {
    const items: DraftItem[] = []
    const now = Date.now()
    const toRemove: string[] = []
  
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(PREFIX)) continue
      try {
        const raw = localStorage.getItem(k)
        if (!raw) continue
        const d = JSON.parse(raw) as Draft
        const expiresAt = d.savedAt + TTL
        if (now > expiresAt) {
          toRemove.push(k)
          continue
        }
        items.push({
          path: k.substring(PREFIX.length),
          content: d.content,
          savedAt: d.savedAt,
          isNew: d.isNew,
          expiresAt,
        })
      } catch {
        toRemove.push(k)
      }
    }
  
    toRemove.forEach(k => localStorage.removeItem(k))
    return items.sort((a, b) => b.savedAt - a.savedAt)
  }