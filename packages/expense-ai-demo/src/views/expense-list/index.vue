<template>
  <div class="expense-list-page">
    <div class="page-header">
      <div>
        <h1>报销单列表</h1>
        <p>从存量业务列表进入，再通过 AI 副屏和页面工具联动打开目标报销单。</p>
      </div>
      <div class="header-actions">
        <tiny-button @click="navigate('/expenses/new-ai')">新建报销单</tiny-button>
        <tiny-button type="primary" @click="navigate('/expenses/new-ai?id=EXP-2026-018')">
          打开 AI 增强版样例
        </tiny-button>
      </div>
    </div>

    <tiny-row :gutter="16" class="summary-row">
      <tiny-col :span="8">
        <tiny-card title="待处理草稿">
          <template #title-right>
            <tiny-tag type="info" size="mini" effect="light">列表联动</tiny-tag>
          </template>
          <div class="summary-value">{{ draftCount }}</div>
          <div class="summary-text">可由 AI 直接查询并打开</div>
        </tiny-card>
      </tiny-col>
      <tiny-col :span="8">
        <tiny-card title="审批中单据">
          <template #title-right>
            <tiny-tag type="warning" size="mini" effect="light">流程中</tiny-tag>
          </template>
          <div class="summary-value">{{ pendingCount }}</div>
          <div class="summary-text">适合演示跨页面跳转与状态解释</div>
        </tiny-card>
      </tiny-col>
      <tiny-col :span="8">
        <tiny-card title="本页总金额">
          <template #title-right>
            <tiny-tag type="success" size="mini" effect="light">实时</tiny-tag>
          </template>
          <div class="summary-value">¥ {{ totalAmount }}</div>
          <div class="summary-text">AI 查询会同步驱动筛选器</div>
        </tiny-card>
      </tiny-col>
    </tiny-row>

    <tiny-card title="筛选条件" class="filter-card">
      <tiny-row :gutter="16" align="middle">
        <tiny-col :span="8">
          <div class="field-label">状态</div>
          <tiny-select v-model="filterStatus" placeholder="请选择状态" clearable>
            <tiny-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </tiny-select>
        </tiny-col>
        <tiny-col :span="10">
          <div class="field-label">关键字</div>
          <tiny-input v-model="searchText" placeholder="输入报销单号、标题或申请人" clearable />
        </tiny-col>
        <tiny-col :span="6" class="filter-actions">
          <tiny-button @click="resetFilters">重置</tiny-button>
          <tiny-button type="primary" @click="navigate('/expenses/new-ai?id=EXP-2026-018')">
            进入 AI 增强页
          </tiny-button>
        </tiny-col>
      </tiny-row>
    </tiny-card>

    <tiny-card title="报销单明细">
      <tiny-grid :data="filteredDrafts" border class="draft-grid">
        <tiny-grid-column field="id" title="报销单号" width="140">
          <template #default="{ row }">
            <span class="draft-id">{{ row.id }}</span>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="title" title="标题" min-width="240" />
        <tiny-grid-column field="applicant" title="申请人" width="100" />
        <tiny-grid-column field="department" title="部门" width="120" />
        <tiny-grid-column field="detailCount" title="明细数" width="90" align="center" />
        <tiny-grid-column field="totalAmount" title="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥ {{ formatCurrency(row.totalAmount) }}</span>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="status" title="状态" width="120" align="center">
          <template #default="{ row }">
            <tiny-tag :type="statusTagMap[row.status as ExpenseStatus]" size="mini" effect="light">
              {{ row.status }}
            </tiny-tag>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="updatedAt" title="更新时间" width="160" />
        <tiny-grid-column title="操作" width="160" align="center">
          <template #default="{ row }">
            <button class="link-button" @click="openDraft(row.id)">打开</button>
          </template>
        </tiny-grid-column>
      </tiny-grid>
    </tiny-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { expenseDrafts, formatCurrency, type ExpenseStatus } from '../../mock'
import { useHostContext } from '../../platform/host-context'

const { aiBridge, navigate } = useHostContext()
const searchText = ref('')
const filterStatus = ref<ExpenseStatus | ''>('')

const statusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '审批中', value: '审批中' },
  { label: '已驳回', value: '已驳回' },
  { label: '已通过', value: '已通过' }
] as const

const statusTagMap: Record<ExpenseStatus, 'info' | 'warning' | 'danger' | 'success'> = {
  草稿: 'info',
  审批中: 'warning',
  已驳回: 'danger',
  已通过: 'success'
}

const filteredDrafts = computed(() =>
  expenseDrafts.filter((item) => {
    const matchStatus = !filterStatus.value || item.status === filterStatus.value
    const keyword = searchText.value.trim().toLowerCase()
    const matchSearch =
      !keyword ||
      item.id.toLowerCase().includes(keyword) ||
      item.title.toLowerCase().includes(keyword) ||
      item.applicant.toLowerCase().includes(keyword)

    return matchStatus && matchSearch
  })
)

const draftCount = computed(() => expenseDrafts.filter((item) => item.status === '草稿').length)
const pendingCount = computed(() => expenseDrafts.filter((item) => item.status === '审批中').length)
const totalAmount = computed(() => formatCurrency(filteredDrafts.value.reduce((sum, item) => sum + item.totalAmount, 0)))

const resetFilters = () => {
  searchText.value = ''
  filterStatus.value = ''
}

const openDraft = async (expenseId: string) => {
  await navigate(`/expenses/new-ai?id=${expenseId}`)
}

let cleanupPageTool: (() => void) | undefined

onMounted(() => {
  cleanupPageTool = aiBridge.registerPageTool({
    route: '/expenses',
    handlers: {
      expense_list_query: async ({ keyword, status }: { keyword?: string; status?: ExpenseStatus }) => {
        searchText.value = keyword ?? ''
        filterStatus.value = status ?? ''

        const result = filteredDrafts.value

        return {
          content: [
            {
              type: 'text',
              text:
                result.length === 0
                  ? '未找到符合条件的报销单。'
                  : `找到 ${result.length} 条报销单：\n${result
                      .map((item) => `- ${item.id}｜${item.title}｜${item.applicant}｜${item.status}`)
                      .join('\n')}`
            }
          ]
        }
      },
      expense_open_draft: async ({ expenseId }: { expenseId: string }) => {
        const target = expenseDrafts.find((item) => item.id === expenseId)

        if (!target) {
          return {
            content: [{ type: 'text', text: `未找到编号为 ${expenseId} 的报销单。` }]
          }
        }

        await openDraft(expenseId)

        return {
          content: [
            {
              type: 'text',
              text: `已打开 ${target.id}，标题为“${target.title}”，当前状态为 ${target.status}。`
            }
          ]
        }
      }
    }
  })
})

onUnmounted(() => {
  cleanupPageTool?.()
})
</script>

<style scoped>
.expense-list-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.page-header p {
  margin: 8px 0 0;
  color: #5c6272;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.summary-row :deep(.tiny-card) {
  min-height: 152px;
}

.summary-value {
  margin-top: 10px;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #0057c3;
}

.summary-text {
  margin-top: 10px;
  color: #727786;
  font-size: 13px;
  line-height: 1.6;
}

.field-label {
  margin-bottom: 8px;
  color: #5c6272;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.filter-card {
  margin-top: 4px;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;
}

.draft-grid {
  margin-top: 6px;
}

.draft-id {
  color: #0057c3;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 700;
}

.amount-text {
  font-weight: 700;
}

.link-button {
  border: none;
  background: transparent;
  color: #0057c3;
  cursor: pointer;
  font-weight: 700;
}
</style>
