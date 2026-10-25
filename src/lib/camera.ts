import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { compressImage } from './compress'

export type ImageSource = 'camera' | 'gallery'

export async function pickImage(source: ImageSource): Promise<string | null> {
  let base64: string | null = null

  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 90, // 交给插件保持较高质量，压缩由 compressImage 统一处理
        resultType: CameraResultType.Base64,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      })
      base64 = photo.base64String ?? null
    } catch {
      return null
    }
  } else {
    base64 = await pickViaInput(source)
  }

  if (!base64) return null

  try {
    return await compressImage(base64)
  } catch (e) {
    // 压缩失败降级用原图，不阻塞上传
    console.warn('压缩失败，使用原图', e)
    return base64
  }
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