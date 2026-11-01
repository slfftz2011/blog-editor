import { InAppBrowser } from '@capacitor/inappbrowser';

export async function openExternal(url: string) {
  try {
    await InAppBrowser.openInExternalBrowser({ url });
  } catch (error) {
    console.error('Failed to open external browser:', error);
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}