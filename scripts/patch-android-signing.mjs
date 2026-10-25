import { readFileSync, writeFileSync } from 'node:fs'

const GRADLE_PATH = 'android/app/build.gradle'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

// 从 tag 解析版本号：v0.2.0 -> versionName "0.2.0"，versionCode 递增
const tag = process.env.GITHUB_REF_NAME ?? ''
const versionName = tag.replace(/^v/, '') || pkg.version || '0.1.0'
// versionCode 需要单调递增，这里用 major*10000 + minor*100 + patch 简化为整数
function toCode(v) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc|pre)\.?(\d+)?)?$/i)
  if (!m) {
    return Math.floor(Date.now() / 1000)
  }

  const base =
    parseInt(m[1], 10) * 10000 +
    parseInt(m[2], 10) * 100 +
    parseInt(m[3], 10)

  const stage = (m[4] || '').toLowerCase()
  const n = parseInt(m[5] || '1', 10)

  let suffix
  switch (stage) {
    case '':      suffix = 999; break       // 正式版
    case 'pre':   suffix = 750 + n; break   // pre.1 → 751
    case 'rc':    suffix = 500 + n; break   // rc.1  → 501
    case 'beta':  suffix = 250 + n; break   // beta.1 → 251
    case 'alpha': suffix = 1 + n; break     // alpha.1 → 2
    default:      suffix = 999; break
  }

  return base * 1000 + suffix
}
const versionCode = toCode(versionName)

let gradle = readFileSync(GRADLE_PATH, 'utf8')

// 1. 在 android { 块内注入 signingConfigs
if (!gradle.includes('signingConfigs')) {
  gradle = gradle.replace(
    /android\s*\{/,
    `android {
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "release.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
`,
  )
}

// 2. release buildType 绑定 signingConfig
gradle = gradle.replace(
  /(buildTypes\s*\{[\s\S]*?release\s*\{)/,
  `$1
            signingConfig signingConfigs.release`,
)

// 3. 覆盖版本号
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`)

writeFileSync(GRADLE_PATH, gradle)
console.log(`Patched ${GRADLE_PATH}: versionName=${versionName}, versionCode=${versionCode}`)