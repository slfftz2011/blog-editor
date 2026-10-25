const MAX_BYTES = 1024 * 1024        // 1MB
const MAX_DIMENSION = 1920            // 最长边上限
const MIN_QUALITY = 0.5

/** 计算 base64 解码后的字节数（不需要真的解码） */
function base64ByteLength(b64: string): number {
  const len = b64.replace(/=+$/, '').length
  return Math.floor((len * 3) / 4)
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

async function loadBitmap(b64: string): Promise<ImageBitmap> {
    const blob = base64ToBlob(b64, 'image/jpeg')
    return await createImageBitmap(blob)
  }

/**
 * 将 base64 图片压缩到 1MB 以下。
 * - 原图已小于 1MB：直接返回原图，避免二次编码损失
 * - 超过 1MB：最长边缩到 1920px，然后质量从 0.85 逐档降低直到达标
 * 返回纯 base64（无 data: 前缀）
 */
export async function compressImage(base64: string): Promise<string> {
  if (base64ByteLength(base64) <= MAX_BYTES) {
    return base64
  }

  const bitmap = await loadBitmap(base64)
  let { width, height } = bitmap

  if (Math.max(width, height) > MAX_DIMENSION) {
    const r = MAX_DIMENSION / Math.max(width, height)
    width = Math.round(width * r)
    height = Math.round(height * r)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    throw new Error('canvas context unavailable')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  let quality = 0.85
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (
    base64ByteLength(dataUrl.split(',')[1]) > MAX_BYTES &&
    quality > MIN_QUALITY
  ) {
    quality = Math.max(MIN_QUALITY, quality - 0.1)
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  return dataUrl.split(',')[1]
}