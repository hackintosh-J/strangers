# 部署指南 (Deployment Guide)

恭喜！您的项目架构已经升级为 **Cloudflare Workers + D1**。这是目前最先进的 Serverless 架构之一。

请按照以下步骤完成部署：

## 第一步：准备 Cloudflare 账号
如果没有，请先去 [Cloudflare 官网](https://dash.cloudflare.com/sign-up) 注册一个免费账号。

## 第二步：安装依赖 & 登录
在项目根目录下打开终端，运行：
```bash
npm install
npx wrangler login
```
(浏览器会自动弹出，点击允许即可)

## 第三步：创建数据库
运行以下命令创建 D1 数据库：
```bash
npx wrangler d1 create strangers-db
```
**重要**：命令运行成功后，终端会输出一段 `[[d1_databases]]` 配置信息。
请复制其中的 `database_id`，并粘贴到项目根目录下的 `wrangler.toml` 文件中，替换掉 `MESSAGE_ME_TO_FILL_THIS`。

## 第四步：初始化表结构
运行以下命令建立数据表：
```bash
npx wrangler d1 execute strangers-db --file=backend/schema.sql --remote
```

## 第五步：部署后端
运行以下命令将后端发布到全球网络：
```bash
npx wrangler deploy
```
部署成功后，终端会输出一个 URL，例如 `https://strangers-backend.your-name.workers.dev`。
**请复制这个 URL**。

## 第六步：连接前端
1. 打开 `assets/config.js` 文件。
2. 将 `apiUrl` 的值替换为您刚才获得的 URL。
   ```javascript
   const CONFIG = {
     apiUrl: 'https://strangers-backend.your-name.workers.dev', // 替换这里
   };
   ```
3. 保存文件。

## 第七步：发布前端
最后，将所有修改提交到 GitHub，等待 GitHub Pages 自动构建完成：
```bash
git add .
git commit -m "Deploy: Migrate to Cloudflare Workers"
git push origin main
```

**完成！**
刷新您的网站，它现在是一个高性能、真正的全栈应用了。
