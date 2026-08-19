# Changelog

## 1.0.1

- 新增可从 macOS 启动台直接打开的 Apple Silicon 桌面应用。
- 新增专用 CloseRead 应用图标和本地打包脚本。
- DeepSeek 请求改由 Electron 主进程发起，桌面版不依赖 Vite 服务。
- 修复桌面版预加载桥接未生效导致的 `Failed to fetch`。
- 逐词对照直接显示中文语境释义、词性和音标。
- 整句中文翻译改为独立高亮区域。
