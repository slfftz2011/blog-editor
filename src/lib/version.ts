/**
 * 与 scripts/patch-android-signing.mjs 中的 toCode 保持完全一致。
 * 阶梯：alpha < beta < rc < pre < 正式版
 */
 export function versionCode(v: string): number {
    const m = v.replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc|pre)\.?(\d+)?)?$/i)
    if (!m) return 0
  
    const base =
      parseInt(m[1], 10) * 10000 +
      parseInt(m[2], 10) * 100 +
      parseInt(m[3], 10)
  
    const stage = (m[4] || '').toLowerCase()
    const n = parseInt(m[5] || '1', 10)
  
    let suffix: number
    switch (stage) {
      case '':      suffix = 999; break
      case 'pre':   suffix = 750 + n; break
      case 'rc':    suffix = 500 + n; break
      case 'beta':  suffix = 250 + n; break
      case 'alpha': suffix = 1 + n; break
      default:      suffix = 999; break
    }
  
    return base * 1000 + suffix
  }
  
  export function isNewer(latest: string, current: string): boolean {
    return versionCode(latest) > versionCode(current)
  }