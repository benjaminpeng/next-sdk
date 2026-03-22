# 存量 Vue3 应用 AI 改造清单与任务表

基于当前示例实现整理：

- 主应用壳层：[App.vue](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/App.vue)
- 启动入口：[main.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/main.ts)
- AI Runtime：[runtime.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/platform/ai-bridge/runtime.ts)
- Host 注入：[host-context.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/platform/host-context.ts)
- 契约定义：[types.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/platform/ai-bridge/types.ts)
- MCP Server：[index.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/mcp-servers/index.ts)
- 全局工具：[tools.ts](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/mcp-servers/expense/tools.ts)
- 页面适配示例：
  - 列表页：[expense-list/index.vue](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/views/expense-list/index.vue)
  - 表单页：[expense-new/index.vue](/Users/benjaminpeng/AI/Open-tiny/next-sdk/packages/expense-ai-demo/src/views/expense-new/index.vue)

## 1. 改造目标

把存量 Vue3 应用从“只能人工操作的业务系统”改造成“主应用统一 AI 副屏 + 页面能力可注册 + AI 可读可调度”的系统，且不要求重写现有业务页面。

改造重点不是重做 UI，而是补齐以下平台能力：

- 主应用统一 AI 副屏
- 单例 AI Runtime
- Loader 注入 `aiBridge`
- 页面工具注册与清理
- 业务域技能文档
- 受控执行、审计、权限

## 2. 改造原则

- 主应用只保留一套 AI 副屏，不允许每个子应用各挂一个聊天框。
- `@opentiny/next-sdk`、Tool Registry、MCP Runtime 必须单例。
- 子应用只注册页面工具，不自己创建 AI Runtime。
- 一期优先只读能力和低风险回填，写操作后置。
- 页面工具优先复用现有 `router/store/api/form/grid`，不重写业务逻辑。

## 3. 模块改造清单

### 3.1 主应用

必须完成：

- 在主应用 Layout 中挂载统一 AI 副屏容器。
- 在应用启动时调用 `aiBridge.boot()`。
- 提供统一的 `navigate/ensureRoute` 能力给 AI Runtime。
- 统一维护副屏开关、宽度、会话入口。
- 统一注入模型配置、权限策略、审计能力。

建议产出：

- `Shell Layout` 组件
- `AiPanelHost` 容器
- 主应用级 `router navigator`
- 面板状态持久化方案

验收标准：

- 全站只有一套 AI 副屏。
- 副屏刷新后状态可恢复。
- AI 可以驱动主应用切路由。

### 3.2 Loader

必须完成：

- 向子应用注入 `hostContext/aiBridge`。
- 保证 AI Runtime 和 `@opentiny/next-sdk` 单例。
- 保持业务微组件可多版本并存，但 AI Runtime 不多实例。
- 挂接子应用 `mount/unmount` 生命周期，支持工具注册与清理。

建议产出：

- `@company/ai-bridge-types`
- `@company/ai-bridge-runtime`
- loader 注入协议
- 单例依赖白名单

验收标准：

- 子应用切换后工具注册正确。
- 子应用卸载后工具自动失效。
- 不同版本子应用不导致 AI Runtime 裂开。

### 3.3 子应用

必须完成：

- 页面 `onMounted` 时注册页面工具。
- 页面 `onUnmounted` 时 cleanup。
- 列表页暴露查询、筛选、打开单据能力。
- 表单页暴露读取、回填、校验、补录能力。
- 业务域补齐 `SKILL.md`。

建议产出：

- `pages/*/ai-adapter.ts` 或页面内适配逻辑
- 页面上下文采集函数
- 业务域技能文档

验收标准：

- AI 能读取当前页数据。
- AI 能跨页面打开目标业务单据。
- AI 能触发表单回填和提交前校验。

### 3.4 平台接口

建议最小契约：

```ts
export interface AiBridge {
  boot(): Promise<void>
  navigate(route: string): Promise<void>
  registerPageTool(options: {
    route: string
    handlers: Record<string, (args: any) => Promise<any>>
  }): () => void
  registerSkills?(skills: string | string[]): () => void
  reportPageContext?(ctx: Record<string, any>): void
  getMcpServers(): Record<string, any>
}
```

建议命名规范：

- 页面工具：`domain.page.action`
- 示例：
  - `expense.list.query`
  - `expense.list.open`
  - `expense.form.query`
  - `expense.form.applyInvoice`
  - `expense.form.submitCheck`

验收标准：

- 子应用只依赖契约，不依赖平台内部实现。
- 平台运行时可独立升级，不强迫所有业务同步改代码。

### 3.5 风险控制

必须完成：

- 所有写操作均需要确认。
- 记录用户、时间、页面、工具、参数、结果。
- 工具需要有“页面未就绪”的兜底返回。
- 高风险能力走 RBAC。

一期可暂缓：

- 复杂多 Agent 编排
- 插件市场
- 远程 MCP 治理中心
- 手机远控

## 4. 推荐实施顺序

### 第 0 期：平台基线

目标：

- 让 AI Runtime、loader 注入、页面注册机制跑通。

必须做：

- 定义 `aiBridge` 契约。
- 主应用接单例 AI Runtime。
- Loader 支持 `hostContext` 注入。
- 锁定单例依赖策略。

交付物：

- `aiBridge-types`
- `aiBridge-runtime`
- Loader 注入协议
- 单例依赖清单

### 第 1 期：读多写少 MVP

目标：

- 先实现“能问、能查、能导航、能解释”。

必须做：

- 挂统一 AI 副屏。
- 接本地 MCP Runtime。
- 选两个高价值页面做工具接入。
- 接列表查询、打开单据、表单读取、提交前校验。
- 接业务域 `SKILL.md`。

交付物：

- 副屏上线版本
- 2 个试点页面
- 6 到 10 个工具
- 技能文档

### 第 2 期：受控执行

目标：

- 让 AI 从“问答助手”升级成“受控执行助手”。

必须做：

- 表单回填
- 新增明细
- 写操作确认
- 审计日志
- 审批预警

交付物：

- 结构化回填能力
- Confirm Dialog 规范
- 审计记录
- 高风险策略

### 第 3 期：平台化扩展

目标：

- 做成可复用的平台能力。

必须做：

- 更多业务域接入
- 统一技能资产库
- 指标监控
- 远程 MCP 接入规范

## 5. 任务表

| ID | 阶段 | 模块 | 任务 | 负责人建议 | 产出物 | 验收标准 | 依赖 |
|---|---|---|---|---|---|---|---|
| T01 | 第0期 | 平台 | 定义 `aiBridge` 契约 | 平台团队 | `ai-bridge-types` 包 | 契约评审通过，子应用可仅依赖 types | 无 |
| T02 | 第0期 | 平台 | 实现单例 AI Runtime | 平台团队 | `ai-bridge-runtime` 包 | 主应用仅创建一份 Runtime | T01 |
| T03 | 第0期 | 主应用 | 接入统一 AI 副屏容器 | 主应用团队 | `AiPanelHost` | 任意页面可打开副屏 | T02 |
| T04 | 第0期 | 主应用 | 提供统一导航能力 | 主应用团队 | `ensureRoute/navigate` | AI 可驱动路由切换 | T02 |
| T05 | 第0期 | Loader | 支持注入 `hostContext` | Loader 团队 | loader 注入协议 | 子应用拿到 `aiBridge` 实例 | T01 |
| T06 | 第0期 | Loader | 锁定单例依赖策略 | Loader 团队 | 单例白名单 | `next-sdk` 不会被重复实例化 | T05 |
| T07 | 第1期 | 业务试点 | 选 2 个高价值页面试点 | 业务负责人 | 页面名单 | 页面范围冻结 | T03,T05 |
| T08 | 第1期 | 子应用 | 接列表页页面工具 | 业务前端团队 | `query/open/filter` 工具 | AI 可查询并打开单据 | T07 |
| T09 | 第1期 | 子应用 | 接表单页页面工具 | 业务前端团队 | `read/check/apply` 工具 | AI 可读表单并做校验 | T07 |
| T10 | 第1期 | 平台 | 注册全局规则与预算工具 | 平台团队 | 全局工具模块 | AI 可回答规则和预算类问题 | T02 |
| T11 | 第1期 | 业务试点 | 补齐业务域 `SKILL.md` | 业务团队 + 产品 | 技能文档 | AI 术语解释准确度提升 | T08,T09 |
| T12 | 第1期 | 主应用 | 配置副屏快捷提示与技能注入 | 主应用团队 | prompt/pills 配置 | 首屏可直接触发高频任务 | T03,T11 |
| T13 | 第1期 | QA | 做只读能力联调与回归 | QA | 测试报告 | 查询、读取、跳转链路稳定 | T08,T09,T10 |
| T14 | 第2期 | 子应用 | 接表单回填能力 | 业务前端团队 | 回填 handler | AI 可根据解析结果更新表单 | T09 |
| T15 | 第2期 | 子应用 | 接新增明细能力 | 业务前端团队 | detail handler | AI 可补录明细并更新总额 | T09 |
| T16 | 第2期 | 平台 | 加确认弹窗与执行策略 | 平台团队 + 主应用 | Confirm Policy | 写操作默认需确认 | T14,T15 |
| T17 | 第2期 | 平台 | 接审计日志 | 平台团队 | 审计落库/日志协议 | 能查到每次工具执行记录 | T16 |
| T18 | 第2期 | QA | 做回填与提交前校验回归 | QA | 测试报告 | 回填、校验、预警正确 | T14,T15,T16 |
| T19 | 第3期 | 平台 | 建技能资产库与模板 | 平台团队 | 技能仓库 | 新业务域可快速复用模板 | T11 |
| T20 | 第3期 | 平台 | 增加监控指标 | 平台团队 | 指标面板 | 能监控成功率、耗时、失败率 | T17 |
| T21 | 第3期 | 业务推广 | 扩展更多业务域接入 | 各业务前端 | 新接入页面 | 新页面接入周期可控 | T19 |

## 6. 页面优先级建议

优先接入页面类型：

- 列表页：适合做查询、筛选、打开、定位
- 表单页：适合做读取、回填、校验
- 审批页：适合做规则解释、审批建议
- 报表页：适合做汇总、异常说明

不建议一期优先接入：

- 高危写操作页
- 涉及复杂权限切换的后台设置页
- 依赖多个外部系统联动的流程页

## 7. 研发落地口径

### 主应用团队

负责：

- AI 副屏
- 主应用路由协调
- 会话体验
- 面板状态和交互

### Loader 团队

负责：

- 运行时注入
- 单例依赖治理
- 生命周期挂接

### 平台团队

负责：

- AI Runtime
- Tool Registry
- Skills 注入
- 审计与策略

### 业务团队

负责：

- 页面工具实现
- 页面上下文采集
- 业务规则沉淀

## 8. 立即可执行的最小动作

如果当前就要开工，建议按下面顺序推进：

1. 定 `aiBridge` 契约。
2. 在主应用挂 AI 副屏。
3. 在 Loader 注入 `hostContext`。
4. 选两个页面做工具适配。
5. 上线只读问答和提交前校验。
6. 再接回填、确认、审计。

