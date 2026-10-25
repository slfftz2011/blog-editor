import { isNewer } from './version'

const REPO = 'slfftz2011/blog-editor'

export interface UpdateInfo {
  version: string
  tag: string
  url: string
  apkUrl: string | null
  notes: string
  publishedAt: string
}

export async function checkUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/releases?per_page=20`,
    { headers: { Accept: 'application/vnd.github+json' } },
  )
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}（可能触发限流，稍后再试）`)
  }

  const releases: any[] = await res.json()
  const valid = releases.filter(r => !r.draft && r.tag_name)
  if (valid.length === 0) return null

  let latest: any = valid[0]
  for (const r of valid.slice(1)) {
    if (isNewer(r.tag_name, latest.tag_name)) latest = r
  }

  const currentTag = 'v' + currentVersion
  if (!isNewer(latest.tag_name, currentTag)) return null

  const apkAsset = (latest.assets as any[] | undefined)?.find(
    a => typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk'),
  )

  return {
    version: String(latest.tag_name).replace(/^v/, ''),
    tag: latest.tag_name,
    url: latest.html_url,
    apkUrl: apkAsset?.browser_download_url ?? null,
    notes: (latest.body ?? '').slice(0, 2000),
    publishedAt: latest.published_at,
  }
}