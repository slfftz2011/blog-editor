import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

export type ImageSource = 'camera' | 'gallery'

export async function pickImage(source: ImageSource): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Base64,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      })
      return photo.base64String ?? null
    } catch (e) {
      return null
    }
  }
  return pickViaInput(source)
}

function pickViaInput(source: ImageSource): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (source === 'camera') {
      input.setAttribute('capture', 'environment')
    }
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        resolve(dataUrl.split(',')[1] ?? null)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  })
}