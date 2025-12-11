# strangers

一个以「陌生人留言」为核心的轻量级静态站点，聚合来自世界各地的真诚留言。目标是保持页面极简、加载快速，并鼓励访客以安全、匿名的方式分享感受。

## 在线预览
- GitHub Pages：<https://your-github-username.github.io/strangers/>

## 本地预览
你可以直接用最少依赖的方式预览，也可以按需安装前端依赖：

- **零依赖预览（推荐）**：
  ```bash
  python -m http.server 4173
  ```
  然后浏览器访问 <http://localhost:4173>。

- **安装依赖再预览（可选）**：
  ```bash
  npm install
  npm run dev
  ```
  默认会在 <http://localhost:5173> 提供热更新开发服务器。

## 投稿 / 留言
欢迎通过 Issue 模板投稿或留言：<https://github.com/your-github-username/strangers/issues/new/choose>

## 构建与发布（如使用 Vite 或其他构建工具）
当前页面可以纯静态托管，无需额外构建。如果你选择使用 Vite 等构建工具，请遵循下列流程：

1. 安装依赖：
   ```bash
   npm install
   ```
2. 本地开发：
   ```bash
   npm run dev
   ```
3. 生产构建：
   ```bash
   npm run build
   ```
   构建产物位于 `dist/`。
4. 发布到 GitHub Pages：
   - 将 `dist/` 内容推送到 `gh-pages` 分支，或
   - 在仓库 Settings → Pages 选择 `GitHub Actions`，使用 Vite 官方的 `static.yml` 模板自动发布。

## 常见问题
- **速率限制**：GitHub API 访问在未登录或频繁请求时可能触发速率限制。若遇到接口失败，请稍后再试，或使用个人访问令牌（PAT）配置请求头。
- **缓存问题**：浏览器或 CDN 可能缓存旧的留言列表。使用强制刷新（`Ctrl + F5`）或在请求 URL 添加时间戳参数（如 `?t=1690000000`）以绕过缓存。

## 许可
本项目使用 MIT License，欢迎 fork 和二次创作。
