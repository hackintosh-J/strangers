# 如何获取安卓 APK (How to get the Android APK)

既然我已经将你的应用配置为 **PWA (Progressive Web App)**，你现在可以非常轻松地生成一个永久可用的 APK，而且**不需要**每次更新网页时都重新安装 APK。

## 步骤 1: 部署更新
确保你已经部署了最新的代码（包含我刚刚添加的 PWA 配置和图标）。
```bash
npm run deploy
```
*或者你使用的任何部署命令。*

## 步骤 2: 使用 PWABuilder 生成 APK
这是微软和谷歌推荐的免费工具，可以将任何 PWA 网站打包成 APK。

1. 打开 [PWABuilder.com](https://www.pwabuilder.com/)。
2. 输入你的网站 URL (例如 `https://strangers.hackins.club`，请确保是 HTTPS)。
3. 点击 **Start**。
4. 等待评估完成，你应该会看到 "Android" 选项。
5. 点击 **Store Package** 或 **Generate** (Android)。
6. 在弹出的选项中：
   - **Signing Key**: 选择 "None" 或 "PWABuilder Key" (用于测试/朋友使用，这最简单)。
   - 点击 **Download**。

## 步骤 3: 发送给朋友
你会下载到一个 `.zip` 文件，解压后里面会有一个 `.apk` 文件 (通常在 `android/app/build/outputs/apk/debug/` 或类似路径，或者直接就在根目录)。

直接把这个 `.apk` 发送给你的安卓朋友安装即可！

### 为什么这个方案好？
* **自动更新**: 这个 APK 本质上是一个浏览器壳，它加载的是你网站的最新内容。只要你部署了新网页，她打开 App 就能看到最新版。
* **原生体验**: 它没有浏览器的地址栏，全屏运行，看起来就像个原生 App。
* **无需开发环境**: 你不需要安装 Android Studio 或配置 Java 环境。
