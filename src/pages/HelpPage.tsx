import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

interface Props {
  onBack: () => void
}

export default function HelpPage({ onBack }: Props) {
  return (
    <div className="page">
      <div className="content-col">
        <header className="page-header page-header--back">
          <h1 className="page-title" style={{ flex: 1 }}>使用教程</h1>
          <button className="btn btn--ghost" onClick={onBack}>返回</button>
        </header>

        <Section title="1. 首次配置" defaultOpen>
          <p>进入「设置」填入以下信息：</p>
          <ul>
            <li><b>Owner</b>：GitHub 用户名，如 <code>slfftz2011</code></li>
            <li><b>仓库名</b>：如 <code>blog</code></li>
            <li><b>分支</b>：通常为 <code>dev</code> 或 <code>main</code></li>
            <li><b>PAT</b>：见下方「创建 PAT」</li>
          </ul>
          <p>填好后可以点击<b>「自动读取 _config.yml」</b>，系统会自动补全文章目录、图片目录和 Root 路径。然后点「保存并进入」。</p>
        </Section>

        <Section title="2. 创建 PAT（Personal Access Token）">
          <ol>
            <li>浏览器打开 <code>github.com/settings/personal-access-tokens</code></li>
            <li>点 <b>Generate new token</b> → <b>Fine-grained token</b></li>
            <li><b>Repository access</b>：Only select repositories → 选中博客仓库</li>
            <li><b>Permissions → Contents</b>：Read and write</li>
            <li>其它权限保持 No access，点 Generate</li>
            <li>复制生成的 token，粘贴到本 App 的 PAT 输入框</li>
          </ol>
          <p className="text-danger">
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6 }} />
            PAT 只保存在浏览器 localStorage，不会上传到任何服务器。
          </p>
        </Section>

        <Section title="3. 编辑与保存">
          <ul>
            <li>文件列表点击文章 → 进入编辑页</li>
            <li>顶部三态切换：<b>编辑</b> / <b>预览</b> / <b>分屏</b>（横屏自动左右分栏）</li>
            <li>编辑后点右上角「保存」→ 直接提交到 GitHub 分支</li>
            <li>保存后博客的 Actions 会自动构建部署，约 1～2 分钟上线</li>
          </ul>
        </Section>

        <Section title="4. 草稿保护">
          <ul>
            <li>编辑中切相机、切后台、来电时自动暂存</li>
            <li>内容变化后 800ms 自动存草稿</li>
            <li>返回文件列表 → 点「草稿箱」查看所有未保存的草稿</li>
            <li>草稿保留 7 天，过期自动清理</li>
            <li>保存成功后草稿自动清除</li>
          </ul>
        </Section>

        <Section title="5. 插入图片">
          <ul>
            <li>编辑页顶部点「图片图标」：可选择拍照或从相册选择</li>
            <li>图片会先在本地预览（不会立刻上传占用空间）</li>
            <li>点击“保存”时，图片会自动压缩到 1MB 以下并上传至图库</li>
            <li>Markdown 链接会自动适配博客的子路径</li>
          </ul>
        </Section>

        <Section title="常见问题">
          <p><b>Q：保存后博客没更新？</b></p>
          <p>A：博客的 Actions 构建部署需要 1～2 分钟，稍等再看。如果超过 5 分钟仍未更新，去 GitHub Actions 看构建日志。</p>
          <p><b>Q：预览里图片裂了？</b></p>
          <p>A：刚上传的图片在 Pages 上有缓存延迟，1～2 分钟后重新进预览即可。如果长期裂图，检查设置里的域名和 Root 路径是否填写正确。</p>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title, defaultOpen = false, children,
}: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  return (
    <details className="help-details" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="help-details__body">{children}</div>
    </details>
  )
}