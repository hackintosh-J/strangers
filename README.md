# strangers

轻量级示例页面，用于演示以下需求的前端占位与体验层：

- 预留 PWA 清单与 Service Worker（离线暖心句子、低频更新）
- 头像/背景主题自定义（纯前端保存）
- 匿名验证码/限流策略（前端提示，待后端或边缘函数接入）

## 使用方式

1. 直接用静态服务器（如 `python -m http.server 8000`）启动项目根目录。
2. 浏览器会自动注册 `service-worker.js`，也可点击页面中的“手动注册”。
3. 暖心句子来自 `warmth-sentences.json`，默认缓存 6 小时，离线可用。
4. 头像与背景主题仅存储在 LocalStorage，可随时重置。
5. 匿名验证码/限流方案写在页面文案中，待接入后端时扩展。

## 文件概览

- `index.html`：页面结构与防滥用方案说明。
- `style.css`：夜间风格主题样式。
- `script.js`：前端逻辑、LocalStorage 持久化、自定义与 SW 注册。
- `service-worker.js`：静态资源与暖心句子缓存，6 小时更新节奏。
- `manifest.webmanifest`：PWA 清单，含 SVG 基础图标。
- `warmth-sentences.json`：离线暖心句子数据源。
- `icons/`：PWA 图标资源。
