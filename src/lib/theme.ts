import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const MODES: readonly ThemeMode[] = ['light', 'dark', 'system']

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && (MODES as readonly string[]).includes(v)) return v as ThemeMode
  } catch {
    /* localStorage 不可用时忽略 */
  }
  return 'system'
}

let current: ThemeMode = typeof window === 'undefined' ? 'system' : readStored()
const listeners = new Set<() => void>()

function apply(mode: ThemeMode) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode)
  }
}

// 首次加载同步一次，和 index.html 内联脚本保持一致
apply(current)

export function getTheme(): ThemeMode {
  return current
}

export function setTheme(mode: ThemeMode) {
  if (mode === current) return
  current = mode
  apply(mode)
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* 忽略写入失败 */
  }
  listeners.forEach(l => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const mode = useSyncExternalStore(
    subscribe,
    getTheme,
    () => 'system' as ThemeMode
  )
  return [mode, setTheme]
}