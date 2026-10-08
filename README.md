# Project Genome

> AI 驱动的项目管理与决策工具：不是更漂亮的 Todo，而是帮助你判断“为什么做、下一步做什么、什么时候停止”。

## 当前状态

MVP 采用 Local First 架构，当前已经实现一个可运行的项目管理工作台：

- 项目总览 / 项目雷达
- Project Opportunity / Health 评分
- 项目阶段管理
- Kanban 任务板与拖拽
- Hypothesis 假设管理
- Experiment 实验记录
- Decision 决策日志
- AI Critic（当前为本地规则引擎，可替换真实模型）
- Project Mutation 项目变异原型
- 项目组合视图 / Attention Allocation
- 本地持久化（localStorage）

## 本地开发

需要 Node.js 20+。

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

## 产品原则

1. 项目优先于任务。
2. 不确定性优先于忙碌度。
3. 先验证，再投入。
4. 暂停 / 终止项目是正常决策。
5. 项目应该能够产生新的项目。

## 下一阶段

- 接入 SQLite / Tauri，形成真正 Local First 数据层
- GitHub / Obsidian 双向集成
- 接入真实 AI Review
- Evidence 证据对象与来源引用
- Project Graph
- Project Mutation 转项目
- 周期性 Attention Allocation
