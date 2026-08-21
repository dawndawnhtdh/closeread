# CloseRead

CloseRead 是一个面向英文技术文档读者的本地精读工具。它保留英文原句，提供语境化逐词释义、整句翻译和语法结构说明，帮助你直接阅读原始技术文档，而不是依赖容易丢失术语、逻辑和语气的整页网页翻译。

## 适合谁

CloseRead 主要适合需要阅读英文 API 文档、AI/软件工程教程、GitHub README、技术博客、论文摘要和产品说明的开发者、产品经理、研究人员与技术学习者。

## 核心功能

1. 保留英文原句，并按句逐步精读。
2. 为每个单词显示当前语境中的中文释义、词性和音标。
3. 提供自然的整句中文翻译，而不是逐字拼接。
4. 拆解主干、从句、非谓语和修饰成分。
5. 点击单词查看搭配、句中作用和上下文。
6. 将单词连同原句与释义加入本地生词本。
7. 生词本支持“全部 / 未掌握 / 已掌握”筛选；同一单词自动合并并保留多个语境。
8. 关联名词、形容词、动词、副词等相关词族，并支持 CSV 导出。
9. 提供简明、详细和技术英语三种讲解深度。

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- 一个可用的 [DeepSeek API Key](https://platform.deepseek.com/api_keys)

### 本地运行

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/closeread-english.git
cd closeread-english
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)。

第一次使用时，点击右上角设置，填写 DeepSeek API Key，模型保持 `deepseek-chat`，然后粘贴英文内容并点击“开始精读”。

完整说明见 [中文操作手册](docs/USER_GUIDE_ZH.md)。

## macOS 桌面版

推荐普通用户直接从 GitHub Releases 下载最新版本的 `CloseRead-arm64.zip`。解压后将 `CloseRead.app` 拖入“应用程序”，即可从启动台打开。

在 Apple Silicon Mac 上可以生成独立的 `CloseRead.app`：

```bash
npm run package:mac
```

生成文件位于 `release/CloseRead.app`。将它拖入“应用程序”文件夹后，CloseRead 会出现在启动台中，后续可以直接点击图标启动，不需要运行 Vite 或打开终端。

当前打包脚本会复用本机已有的 Electron.app，并进行本地临时签名，适合个人使用。面向其他用户分发时，还需要 Apple Developer ID 签名和公证。

## 数据与隐私

- API Key 只保存在当前页面内存中，刷新后会清除。
- API Key 不写入 `localStorage`、源码或 Git 仓库。
- 生词本保存在浏览器本地存储中。
- 点击“开始精读”后，粘贴的英文内容会通过本机开发服务发送给 DeepSeek API 进行解析。
- 请勿粘贴公司机密、个人敏感信息或受限制的内部文档。

## 常见问题

### 提示 `Authentication Fails`

请确认使用的是 DeepSeek 平台创建的 Key，而不是 OpenAI Key，并检查账户余额。

### 提示 Key 格式不正确

输入框里只能包含以 `sk-` 开头的完整 Key，不要包含“API Key：”、引号或中文说明。

### 页面显示本地预览提示

请重新打开设置填写 Key，再点击“开始精读”。Key 不会在刷新后保留。

## 技术栈

- React 18
- Vite 5
- DeepSeek Chat Completions API
- 浏览器 LocalStorage 生词本

## 开发与构建

```bash
npm run dev
npm run build
npm run preview
```

## License

[MIT](LICENSE)
