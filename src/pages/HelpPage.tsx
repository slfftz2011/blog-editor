interface Props {
    onBack: () => void
  }
  
  export default function HelpPage({ onBack }: Props) {
    return (
      <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button onClick={onBack} style={btn('#757575')}>返回</button>
          <h1 style={{ fontSize: 22, margin: 0, flex: 1 }}>使用教程</h1>
        </div>
  
        <Section title="1. 首次配置" defaultOpen>
          <p>进入「设置」填入以下信息：</p>
          <ul>
            <li><b>Owner</b>：GitHub 用户名，如 <code>slfftz2011</code></li>
            <li><b>仓库名</b>：如 <code>blog</code></li>
            <li><b>分支</b>：通常为 <code>dev</code> 或 <code>main</code></li>
            <li><b>PAT</b>：见下方「创建 PAT」</li>
            <li><b>文章目录</b>：默认 <code>source/_posts</code></li>
            <li><b>图片目录 / URL 前缀</b>：默认 <code>source/images</code> 和 <code>/images</code></li>
            <li><b>Pages 地址</b>：如 <code>https://slfftz2011.github.io/blog</code>，用于预览图片加速（可选）</li>
          </ul>
          <p>填好后点「测试连接」，显示「已连接」即成功，然后点「保存并进入」。</p>
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
          <p style={{ color: '#c62828' }}>⚠ PAT 只保存在浏览器 localStorage，不会上传到任何服务器。</p>
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
            <li>编辑页顶部「拍照」：调起系统相机，拍完自动上传并插入 Markdown</li>
            <li>「相册」：从相册选择已有图片</li>
            <li>图片自动压缩到 1MB 以下，再上传到图片目录</li>
            <li>插入格式：<code>![image](/images/img_xxx.jpg)</code></li>
          </ul>
        </Section>
  
        <Section title="6. 新建文章">
          <ul>
            <li>文件列表点「新建」→ 输入文件名 → 自动生成 front-matter 模板</li>
            <li>模板包含 <code>title</code>、<code>date</code>、<code>tags</code> 字段</li>
            <li>保存时如果文件不存在会创建，存在则更新</li>
          </ul>
        </Section>
  
        <Section title="7. 检查更新">
          <ul>
            <li>进入「关于」页面点「检查更新」</li>
            <li>会从 GitHub Releases 读取最新版本，对比当前版本</li>
            <li>有新版本时可点「下载 APK」直接获取</li>
            <li>安装新版本前需要允许「安装未知来源应用」</li>
          </ul>
        </Section>
  
        <Section title="常见问题">
          <p><b>Q：保存后博客没更新？</b></p>
          <p>A：博客的 Actions 构建部署需要 1～2 分钟，稍等再看。如果超过 5 分钟仍未更新，去 GitHub Actions 看构建日志。</p>
          <p><b>Q：预览里图片裂了？</b></p>
          <p>A：刚上传的图片在 Pages 上有缓存延迟，1～2 分钟后重新进预览即可。如果长期裂图，检查设置里的 Pages 地址是否填写正确。</p>
          <p><b>Q：PAT 报 403？</b></p>
          <p>A：确认 PAT 的 <b>Contents</b> 权限是 Read and write，且 token 未过期。</p>
          <p><b>Q：装新版本提示「应用未安装」？</b></p>
          <p>A：从 Debug 切到签名 Release 需要先卸载旧版。以后同签名覆盖安装无需卸载。</p>
        </Section>
      </div>
    )
  }
  
  function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    return (
      <details open={defaultOpen} style={{ marginBottom: 10, padding: 12, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8 }}>
        <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 500 }}>{title}</summary>
        <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: '#333' }}>
          {children}
        </div>
      </details>
    )
  }
  
  function btn(bg: string, color = '#fff'): React.CSSProperties {
    return {
      padding: '8px 14px',
      background: bg,
      color,
      border: 'none',
      borderRadius: 8,
      fontSize: 13,
      cursor: 'pointer',
    }
  }