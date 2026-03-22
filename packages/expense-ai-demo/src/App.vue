<template>
  <div class="shell-container">
    <header class="shell-header">
      <div class="brand-block">
        <div class="brand-mark">ERP</div>
        <div>
          <div class="brand-title">Enterprise ERP</div>
          <div class="brand-subtitle">Precision Architect · Expense Management</div>
        </div>
      </div>

      <div class="header-actions">
        <button class="lang-chip">CN/EN</button>
        <button class="panel-toggle" @click="show = !show">
          {{ show ? '收起 AI 副屏' : '打开 AI 副屏' }}
        </button>
        <div class="user-avatar">林</div>
      </div>
    </header>

    <div class="shell-body">
      <aside class="shell-sidebar">
        <div class="sidebar-intro">
          <div class="sidebar-icon">财</div>
          <div>
            <h2>报销中台</h2>
            <p>存量 Vue3 主应用 + AI 副屏改造示例</p>
          </div>
        </div>

        <nav class="nav-list">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            active-class="is-active"
          >
            <span class="nav-item__icon">{{ item.short }}</span>
            <span class="nav-item__content">
              <span class="nav-item__label">{{ item.label }}</span>
              <span class="nav-item__desc">{{ item.desc }}</span>
            </span>
          </router-link>
        </nav>

        <div class="sidebar-footer">
          <div class="status-dot"></div>
          <span>AI Runtime 单例已挂载</span>
        </div>
      </aside>

      <main class="shell-main" :style="{ marginRight: show ? `${rightWidth}px` : '0px' }">
        <router-view />
      </main>

      <div v-if="show" class="shell-divider" :style="{ right: `${rightWidth}px` }" @mousedown="startDrag">
        <div class="divider-handle"></div>
      </div>

      <aside v-if="show" class="shell-panel" :style="{ width: `${rightWidth}px` }">
        <tiny-remoter
          v-model:show="show"
          class="assistant-panel"
          :title="'报销 AI 副屏'"
          :skills="skillMdModules"
          :mcpServers="mcpServers"
          :systemPrompt="systemPrompt"
          :promptItems="promptItems"
          :pillItems="pillItems"
          layoutMode="relative"
          :pageToolsOnDemand="true"
        />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { TinyRemoter } from '@opentiny/next-remoter'
import { DEFAULT_PANEL_WIDTH, MAX_PANEL_WIDTH, MIN_PANEL_WIDTH, PANEL_STORAGE_KEY } from './const'
import { useHostContext } from './platform/host-context'

const navItems = [
  {
    to: '/expenses',
    short: 'LS',
    label: '报销单列表',
    desc: '查询草稿、审批中和驳回单据'
  },
  {
    to: '/expenses/new-ai',
    short: 'AI',
    label: '新建报销单',
    desc: '高保真表单 + 发票智能填充'
  }
]

const promptItems = [
  {
    label: '智能填充',
    description: '根据已上传发票，补全当前报销单的标题、日期、币种和费用明细。',
    icon: h('span', { style: { fontSize: '18px' } }, '🧾'),
    badge: 'AI'
  },
  {
    label: '预算检查',
    description: '查询部门预算快照，判断当前报销单是否需要预算预警。',
    icon: h('span', { style: { fontSize: '18px' } }, '📊')
  },
  {
    label: '提交前校验',
    description: '检查缺失字段、审批链路和高额报销提示。',
    icon: h('span', { style: { fontSize: '18px' } }, '✅')
  }
]

const pillItems = [
  {
    id: 'fill',
    text: '智能填充',
    menus: [
      {
        id: 0,
        text: '根据发票补全表单',
        inputMessage: '请根据当前页面里已解析完成的发票，帮我补全报销单。'
      },
      {
        id: 1,
        text: '读取当前表单',
        inputMessage: '请读取当前报销单的核心字段、明细总额和附件状态。'
      }
    ]
  },
  {
    id: 'policy',
    text: '规则与预算',
    menus: [
      {
        id: 0,
        text: '查询报销政策',
        inputMessage: '请结合当前表单金额，告诉我有哪些报销规则需要关注。'
      },
      {
        id: 1,
        text: '查询部门预算',
        inputMessage: '帮我看一下当前部门的预算快照和剩余额度。'
      }
    ]
  },
  {
    id: 'submit',
    text: '提交前检查',
    menus: [
      {
        id: 0,
        text: '做提交校验',
        inputMessage: '请检查当前报销单是否已经满足提交审批条件。'
      }
    ]
  }
]

const systemPrompt = `你是“企业 ERP 报销助手”。请遵守以下规则：

1. 优先调用明确存在的工具，不要猜测工具名。
2. 当用户提到“当前页面”“这个报销单”“帮我补全表单”时，优先使用当前激活路由下的页面工具。
3. 当用户提到政策、预算、审批阈值时，可以使用通用工具读取规则与预算信息。
4. 生成结论时尽量输出结构化结果：已完成项、待补项、风险提示、建议动作。
5. 如果工具返回页面尚未准备好或没有附件，请明确告诉用户下一步应该怎么操作。`

const skillMdModules = import.meta.glob('./skills/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, string>

const show = ref(true)
const savedWidthText = localStorage.getItem(PANEL_STORAGE_KEY)
const savedWidth = savedWidthText ? Number(savedWidthText) : Number.NaN
const rightWidth = ref(
  Number.isNaN(savedWidth) || savedWidth < MIN_PANEL_WIDTH || savedWidth > MAX_PANEL_WIDTH
    ? DEFAULT_PANEL_WIDTH
    : savedWidth
)

const { aiBridge } = useHostContext()
const mcpServers = aiBridge.getMcpServers()

const startDrag = (event: MouseEvent) => {
  event.preventDefault()

  const startX = event.clientX
  const startWidth = rightWidth.value

  const onMove = (moveEvent: MouseEvent) => {
    const delta = startX - moveEvent.clientX
    rightWidth.value = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, startWidth + delta))
  }

  const onUp = () => {
    localStorage.setItem(PANEL_STORAGE_KEY, String(rightWidth.value))
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.shell-container {
  min-height: 100%;
  background:
    radial-gradient(circle at top right, rgba(0, 110, 243, 0.08), transparent 26%),
    #f9f9ff;
  color: #151c28;
}

.shell-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px 0 12px;
  border-bottom: 1px solid rgba(193, 198, 215, 0.42);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9px;
  background: linear-gradient(135deg, #0057c3 0%, #006ef3 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  box-shadow: 0 10px 18px rgba(0, 87, 195, 0.12);
}

.brand-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.brand-subtitle {
  margin-top: 1px;
  color: #5c6272;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-chip,
.panel-toggle {
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-chip {
  padding: 6px 10px;
  background: transparent;
  color: #0057c3;
  font-size: 10px;
  font-weight: 700;
}

.panel-toggle {
  padding: 7px 12px;
  background: linear-gradient(135deg, #0057c3 0%, #006ef3 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 10px 18px rgba(0, 87, 195, 0.14);
}

.panel-toggle:hover {
  transform: translateY(-1px);
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e6ebfb;
  color: #151c28;
  font-size: 10px;
  font-weight: 700;
}

.shell-body {
  display: flex;
  height: 100%;
  padding-top: 56px;
  min-width: 0;
}

.shell-sidebar {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 216px;
  padding: 14px 12px;
  border-right: 1px solid rgba(193, 198, 215, 0.45);
  background: linear-gradient(180deg, #f8faff 0%, #f1f5ff 100%);
}

.sidebar-intro {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 10px 18px;
  border-radius: 14px;
  background: transparent;
}

.sidebar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 87, 195, 0.16) 0%, rgba(0, 110, 243, 0.2) 100%);
  color: #0057c3;
  font-size: 14px;
  font-weight: 800;
}

.sidebar-intro h2 {
  margin: 0;
  font-size: 14px;
  line-height: 1.1;
}

.sidebar-intro p {
  margin: 4px 0 0;
  color: #5c6272;
  font-size: 10px;
  line-height: 1.45;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 12px;
  color: #414755;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.nav-item:hover {
  transform: translateX(1px);
  background: rgba(255, 255, 255, 0.7);
}

.nav-item.is-active {
  background: rgba(0, 87, 195, 0.08);
  box-shadow:
    inset -3px 0 0 #0057c3,
    inset 0 0 0 1px rgba(0, 87, 195, 0.05);
}

.nav-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: rgba(0, 87, 195, 0.08);
  color: #0057c3;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.nav-item__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nav-item__label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-item__desc {
  display: block;
  margin-top: 3px;
  color: #727786;
  font-size: 10px;
  line-height: 1.4;
}

.sidebar-footer {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  color: #505d6d;
  font-size: 10px;
  font-weight: 600;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #00b42a;
  box-shadow: 0 0 0 6px rgba(0, 180, 42, 0.12);
}

.shell-main {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: 216px;
  padding: 20px 22px 40px;
  display: flex;
  justify-content: center;
  transition: margin-right 0.2s ease;
}

.shell-divider {
  position: fixed;
  top: 56px;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  width: 10px;
  cursor: col-resize;
}

.divider-handle {
  width: 4px;
  height: 68px;
  margin-left: 3px;
  border-radius: 999px;
  background: rgba(0, 87, 195, 0.18);
}

.shell-panel {
  position: fixed;
  top: 56px;
  right: 0;
  bottom: 0;
  z-index: 25;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(193, 198, 215, 0.45);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(14px);
  box-shadow: -12px 0 28px rgba(0, 87, 195, 0.06);
}

.assistant-panel {
  height: 100%;
  width: 100%;
  min-width: 0;
}

.assistant-panel :deep(.tr-container__dragging-bar-wrapper) {
  display: none;
}

.assistant-panel :deep(.tr-container__header) {
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(193, 198, 215, 0.45);
  background: linear-gradient(180deg, rgba(248, 250, 255, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.assistant-panel :deep(.tr-container__title) {
  color: #151c28;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.assistant-panel :deep(.tr-icon-button) {
  color: #5c6272;
}

.assistant-panel :deep(.tr-welcome) {
  padding: 26px 18px 12px;
}

.assistant-panel :deep(.tr-welcome__title) {
  font-size: 26px;
  font-weight: 800;
  color: #151c28;
}

.assistant-panel :deep(.tr-welcome__description) {
  color: #5c6272;
  font-size: 12px;
}

.assistant-panel :deep(.tr-prompts__list-container),
.assistant-panel :deep(.tiny-prompts) {
  padding-inline: 14px;
}

.assistant-panel :deep(.prompt-item) {
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid rgba(193, 198, 215, 0.3);
  background: #fff;
}

.assistant-panel :deep(.tr-prompt__content-title) {
  font-size: 12px;
  font-weight: 800;
}

.assistant-panel :deep(.tr-prompt__content-description) {
  color: #5c6272;
  font-size: 11px;
  line-height: 1.45;
}

.assistant-panel :deep(.tr-container__footer) {
  border-top: 1px solid rgba(193, 198, 215, 0.35);
  background: rgba(255, 255, 255, 0.98);
}

.assistant-panel :deep(.tr-suggestion-pills__item) {
  border: 1px solid rgba(193, 198, 215, 0.4);
  background: #f7f9ff;
}

.assistant-panel :deep(.tr-chat-input-editor-wrapper) {
  border-radius: 16px;
  border: 1px solid rgba(193, 198, 215, 0.45);
  background: #fff;
  box-shadow: none;
}

.assistant-panel :deep(.tr-chat-input-word-counter) {
  color: #8d93a6;
  font-size: 10px;
}
</style>
