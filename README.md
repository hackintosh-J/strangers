# Strangers · 合并项目

欢迎来到 **Strangers** 合并版仓库！本项目旨在汇聚来自世界各地陌生人的真诚留言，并通过不同的页面展示各种互动体验。该仓库融合了原有分支中的所有 Pull Request，并对结构进行了整理，方便本地预览和后续扩展。

## 功能一览

本仓库下包含多个页面，每个页面都聚焦于不同的功能：

| 页面 | 功能 | 说明 |
| --- | --- | --- |
| **首页** (`index.html`) | 导航页 | 汇总所有功能的入口，提供各页面的链接。 |
| **温暖墙** (`warm-wall.html`) | 留言展示 | 从 GitHub issues/discussions 拉取留言并展示，内置示例数据供离线浏览。 |
| **主题多语言主页** (`landing.html`) | 主题 & 语言切换 | 通过切换按钮动态调整页面主题（暖/冷/暗）和语言（英文/中文），示例图案存放在 `assets/illustration.svg`。 |
| **伙伴角** (`tools.html`) | 随机暖语、呼吸练习、歌单推荐、微小幸福 | 通过随机算法产生暖心句子、播放计时器进行呼吸练习、随机选择歌单链接，并提供本地存储的“每日小确幸”记录功能。 |
| **无障碍演示** (`accessible.html`) | 无障碍 & 主题语言切换 | 类似主页，但增加了更多可访问性的标签和操作提示，方便屏幕阅读器使用。 |
| **投稿草稿** (`draft.html`) | 草稿撰写与导出 | 填写投稿草稿，保存到浏览器本地存储，可导出为 JSON 文件，并通过预填表单跳转到 GitHub Issue 或 Discussion 发布。 |
| **PWA 离线体验** (`pwa/index.html`) | 渐进式 Web 应用 | 支持 service worker、manifest 清单、离线暖心句缓存、自定义头像与主题，以及防滥用策略占位说明。 |

## 快速开始

这是一个纯静态站点，不依赖后端服务。在本地运行非常简单：

```bash
# 进入项目所在目录
cd strangers

# 使用 Python 自带的服务器快速预览
python -m http.server 8000

# 然后在浏览器访问 http://localhost:8000/index.html
```

你也可以使用任何其他静态服务器（如 `npm serve`、`live-server` 等）来预览。

## 目录结构

```
strangers/
├── index.html            # 导航页
├── warm-wall.html        # 温暖墙功能页面
├── landing.html          # 主题与多语言主页
├── tools.html            # 伙伴角功能页面
├── accessible.html       # 无障碍演示页面
├── draft.html            # 投稿草稿页面
├── assets/               # 静态图片和资源
│   └── illustration.svg  # 着陆页插图
├── scripts/              # 各页面的脚本
│   ├── warm-wall.js
│   ├── api.js
│   ├── landing.js
│   ├── tools.js
│   ├── accessible.js
│   ├── i18n.js
│   └── draft.js
├── styles/               # 公共样式
│   ├── landing.css
│   ├── tools.css
│   └── accessible.css
└── pwa/                  # PWA 示例页面
    ├── index.html
    ├── script.js
    ├── style.css
    ├── service-worker.js
    ├── manifest.webmanifest
    ├── warmth-sentences.json
    └── icons/
        ├── icon-192.svg
        └── icon-512.svg
```

## 许可

本项目使用 MIT License，欢迎 fork、修改和二次创作。如有建议或想法，欢迎提交 Issue 交流。