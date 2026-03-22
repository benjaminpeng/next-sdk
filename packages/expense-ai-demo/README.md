# Expense AI Demo

基于 `@opentiny/next-sdk`、`@opentiny/vue`、`@opentiny/next-remoter` 搭建的 Vue3 报销 AI 改造示例。

这个示例对应的目标场景是：

- 存量 Vue3 主应用
- 同窗体微前端，不使用 iframe
- 主应用和平台团队统一掌控 AI Runtime
- 子应用通过页面工具、技能文档、页面上下文接入 AI 副屏

## 运行

在工作区根目录执行：

```bash
cd /Users/benjaminpeng/AI/Open-tiny/next-sdk
pnpm install
pnpm dev:expense
```

默认访问地址：

- `http://localhost:8091/expense-ai-demo/expenses`
- `http://localhost:8091/expense-ai-demo/expenses/new-ai`

构建命令：

```bash
pnpm build:expense
```

## 这个示例用了什么

- `@opentiny/next-sdk`
  - 本地单例 `WebMcpServer`
  - `withPageTools`
  - `createMessageChannelPairTransport`
  - 页面级 `registerPageTool`
- `@opentiny/next-remoter`
  - 作为右侧 AI 副屏
  - 开启 `pageToolsOnDemand`
  - 读取本地 Skills Markdown
- `@opentiny/vue`
  - `TinyForm`
  - `TinyRow/TinyCol`
  - `TinyCard`
  - `TinyGrid`
  - `TinyFileUpload`
  - `TinyTag`
  - `TinyButton`

## 架构映射

这个 demo 只有一个应用包，但代码结构是按“主应用 / AI Runtime / 子应用页面”去模拟的，方便迁移到真实微前端项目。

### 1. 主应用 Shell

文件：

- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/App.vue](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/App.vue)
- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/main.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/main.ts)

职责：

- 顶部壳层与左侧导航
- 统一挂载 AI 副屏
- 保存副屏宽度和开关状态
- 在应用启动时注入 host context
- 通过 `aiBridge.boot()` 启动本地 MCP Server

迁移到真实项目时，对应你们的：

- 主应用 Layout
- 平台统一 AI Side Panel 容器
- Shell Router

### 2. AI Runtime / Host Singleton

文件：

- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/mcp-servers/index.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/mcp-servers/index.ts)
- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/mcp-servers/common.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/mcp-servers/common.ts)
- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/mcp-servers/expense/tools.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/mcp-servers/expense/tools.ts)
- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/platform/ai-bridge/runtime.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/platform/ai-bridge/runtime.ts)
- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/platform/host-context.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/platform/host-context.ts)

职责：

- 创建单例 `WebMcpServer`
- 通过 `withPageTools` 接入页面工具桥接
- 注册全局可用的政策、预算类工具
- 通过 MessageChannel 把工具运行时暴露给 AI 副屏
- 通过 `aiBridge` 把导航、工具注册、MCP 配置抽成注入能力

迁移到真实项目时，对应你们的：

- 平台 AI Kernel
- 主应用统一 Tool Registry
- Loader 注入给子应用的共享 AI Runtime
- 主应用注入给子应用的 `hostContext/aiBridge`

### 3. 子应用页面能力

文件：

- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/views/expense-list/index.vue](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/views/expense-list/index.vue)
- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/views/expense-new/index.vue](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/views/expense-new/index.vue)

职责：

- 页面挂载时通过注入的 `aiBridge` 注册页面工具
- 页面卸载时 cleanup
- 让 AI 能读取当前表单、查询列表、打开单据、回填发票结果、执行提交前校验

迁移到真实项目时，对应你们的：

- 业务子应用里的页面适配层
- 只暴露页面工具，不自己初始化 AI Runtime
- 通过 loader 注入的上下文访问导航与 AI 能力

### 4. Skills

文件：

- [/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/skills/expense/SKILL.md](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/skills/expense/SKILL.md)

职责：

- 给 AI 提供报销领域术语、工作流、业务规则背景
- 让模型优先按你们的业务语义解释和调用工具

迁移到真实项目时，对应你们的：

- 每个业务域维护自己的 `SKILL.md`
- 由平台统一收集并注入到副屏

## 当前示例里的智能化能力

### 已实现

- 右侧 AI 副屏统一挂载
- 本地 MCP Server 单例
- 报销单列表页面工具
- 新建报销单页面工具
- 发票上传后的模拟 OCR / 智能填充
- 提交前校验摘要
- 政策规则和预算快照查询
- 路由级工具按需暴露

### 重点工具

- `expense_policy_query`
- `expense_budget_snapshot`
- `expense_list_query`
- `expense_open_draft`
- `expense_form_query`
- `expense_form_apply_invoice`
- `expense_form_add_detail`
- `expense_submit_readiness_check`

## 高保真页面和组件映射

“新建报销单 (AI 智能填充增强版)” 这一页的主要映射如下：

- 基本信息区：`TinyForm + TinyRow + TinyCol + TinyInput + TinySelect + TinyDatePicker`
- 费用明细区：`TinyGrid`
- 发票上传区：`TinyFileUpload`
- 智能提示 / 校验摘要 / 规则卡片：`TinyCard + TinyTag`
- AI 副屏：`TinyRemoter`

这样做的原因是：

- 和存量 OpenTiny 企业后台风格一致
- 方便逐页替换，不要求一次性重做主应用
- 页面级工具可以自然绑定到已有表单、列表、详情页

## 迁移到真实微前端项目时的建议拆分

### 主应用

- 保留一套 AI 副屏
- 保留一套 `WebMcpServer`
- 统一维护模型配置、会话、权限、审计

### Loader

- 注入共享的 AI Runtime / `aiBridge`
- 保证 `@opentiny/next-sdk` 为单例
- 允许业务微组件多版本并存
- 对子应用只暴露稳定的 host context，而不是让页面直接 import 平台 SDK

### 子应用

- 页面 mount 时注册工具
- 页面 unmount 时反注册
- 提供业务 `SKILL.md`
- 提供当前页上下文与可执行动作

## 后续真正落地时建议优先做什么

1. 把这个 demo 的 `mcp-servers` 收敛到主应用平台层。
2. 给真实 loader 加一层 `aiBridge` 注入协议。
3. 先挑 2 个高价值页面做页面工具适配。
4. 把 `SKILL.md` 变成业务域标准资产。
5. 二期再接写操作确认、RBAC、审计。

## 已知说明

- 这个示例的业务数据来自本地 mock，便于快速演示。
- 当前示例重点是“架构落位 + 页面能力接入”，不是完整后端 Agent 平台。
- 工作区内其他包目前存在一些既有 TypeScript 问题，因此本示例包构建脚本使用的是 `vite build`，没有把整仓 `vue-tsc -b` 作为示例构建前置条件。
