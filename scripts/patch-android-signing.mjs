import { readFileSync, writeFileSync } from 'node:fs'

const GRADLE_PATH = 'android/app/build.gradle'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const tag = process.env.GITHUB_REF_NAME ?? ''
const versionName = tag.replace(/^v/, '') || pkg.version || '0.1.0'

function toCode(v) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc|pre)\.?(\d+)?)?$/i)
  if (!m) return Math.floor(Date.now() / 1000)
  const base = parseInt(m[1], 10) * 10000 + parseInt(m[2], 10) * 100 + parseInt(m[3], 10)
  const stage = (m[4] || '').toLowerCase()
  const n = parseInt(m[5] || '1', 10)
  let suffix = 999
  if (stage === 'pre') suffix = 750 + n
  else if (stage === 'rc') suffix = 500 + n
  else if (stage === 'beta') suffix = 250 + n
  else if (stage === 'alpha') suffix = 1 + n
  return base * 1000 + suffix
}
const versionCode = toCode(versionName)

let gradle = readFileSync(GRADLE_PATH, 'utf8')
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`)

writeFileSync(GRADLE_PATH, gradle)
console.log(`Patched Version: ${versionName}, Code: ${versionCode}`)