# Project Genome

> AI 驱动的纯前端项目管理与决策工具：不是更漂亮的 Todo，而是帮助你判断“为什么做、下一步做什么、什么时候停止”。

## 当前实现

Project Genome 采用 **Pure Frontend / Static Web App** 架构，所有产品逻辑直接运行在浏览器：

- React + TypeScript + Vite
- 无后端
- 无 Rust / Tauri
- 无服务器数据库
- localStorage 本地数据层
- JSON 导入 / 导出备份
- 本地 AI Critic / Mutation 规则引擎
- GitHub Pages 静态部署

## 本地运行

需要 Node.js 20+。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 架构

```
Browser
├── React UI
├── Project Engine
│   ├── Opportunity Score
│   ├── Health Score
│   ├── Next Action
│   └── Review
├── Local Data
│   └── localStorage
├── JSON Backup
│   ├── Export
│   └── Import
└── Local Intelligence
    ├── AI Critic (rule engine)
    └── Mutation Engine
```

应用构建结果只是静态 HTML / CSS / JS / Asset，可以直接放到任意静态托管平台。

## 数据安全模型

默认项目数据只写入当前浏览器的 localStorage。

因此：

- 换浏览器不会自动共享数据。
- 清除站点数据可能导致本地数据丢失。
- 建议定期使用“导出”生成 JSON 备份。
- 导入 JSON 会直接替换当前项目数据。
- 不应把私有 API Key 硬编码进公开静态站点。

## 产品原则

1. 项目优先于任务。
2. 不确定性优先于忙碌度。
3. 先验证，再投入。
4. 暂停 / 终止项目是正常决策。
5. 项目应该能够产生新的项目。

## 后续演进

保持纯前端路线，优先演进：

- IndexedDB：更大的项目 / Evidence 数据集
- Service Worker / PWA：真正离线运行
- GitHub API：由用户授权后在浏览器直连
- 可选 AI Provider：用户自行配置 Endpoint / Key
- Evidence 证据对象
- Project Graph
- Project Mutation 一键转项目

## License

MIT
