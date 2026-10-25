import { Capacitor } from '@capacitor/core'

export type PlatformType = 'native' | 'mobile-web' | 'desktop'

export function detectPlatform(): PlatformType {
  if (Capacitor.isNativePlatform()) return 'native'
  if (typeof window === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua)
  const touch = navigator.maxTouchPoints > 1
  const narrow = window.innerWidth < 900
  if (mobileUa || (touch && narrow)) return 'mobile-web'
  return 'desktop'
}

/** Pocket Edition：Capacitor APK 或移动浏览器 */
export function isPocketEdition(): boolean {
  const p = detectPlatform()
  return p === 'native' || p === 'mobile-web'
}