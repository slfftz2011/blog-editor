import { readFileSync, writeFileSync } from 'node:fs'

const GRADLE_PATH = 'android/app/build.gradle'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

// 从 tag 解析版本号：v0.2.0 -> versionName "0.2.0"，versionCode 递增
const tag = process.env.GITHUB_REF_NAME ?? ''
const versionName = tag.replace(/^v/, '') || pkg.version || '0.1.0'
// versionCode 需要单调递增，这里用 major*10000 + minor*100 + patch 简化为整数
function toCode(v) {
  const [maj = 0, min = 0, pat = 0] = v.split('.').map(n => parseInt(n, 10) || 0)
  return maj * 10000 + min * 100 + pat
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