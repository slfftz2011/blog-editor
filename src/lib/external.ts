import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

export async function openExternal(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url })
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}