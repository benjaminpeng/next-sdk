<template>
  <div class="expense-form-page">
    <transition name="toast-slide">
      <div v-if="showAutofillToast" class="ai-toast">
        <span class="ai-toast__icon">AI</span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <div class="page-header">
      <div>
        <h1>新建报销单</h1>
        <p>填写费用详情、上传凭证，并通过 AI 智能填充与提交前校验快速完成报销。</p>
      </div>
      <div class="header-actions">
        <tiny-button class="header-btn header-btn--ghost" @click="handleCancel">取消</tiny-button>
        <tiny-button class="header-btn header-btn--draft" @click="handleSaveDraft">保存草稿</tiny-button>
        <tiny-button class="header-btn header-btn--primary" type="primary" @click="handleSubmit">提交审批</tiny-button>
      </div>
    </div>

    <div class="expense-content-grid">
      <div class="expense-content-grid__main">
        <tiny-card class="section-card section-card--form audit-ribbon">
          <div class="section-head">
            <h2 class="section-title">基本信息</h2>
            <tiny-tag type="info" size="mini" effect="light">AI 已预填 {{ aiFieldKeys.length }} 项</tiny-tag>
          </div>

          <tiny-form ref="formRef" :model="formModel" :rules="formRules" label-width="0px" class="expense-form">
            <tiny-form-item prop="title">
              <div class="field-label">
                报销单标题 <span class="required-mark">*</span>
                <span v-if="isAiFilled('title')" class="ai-badge">AI</span>
              </div>
              <tiny-input v-model="formModel.title" class="field-control field-control--ai" placeholder="请输入报销单标题" />
            </tiny-form-item>

            <div class="form-grid">
              <tiny-form-item prop="department">
                <div class="field-label">报销部门 <span class="required-mark">*</span></div>
                <tiny-select v-model="formModel.department" class="field-control" placeholder="请选择部门">
                  <tiny-option v-for="item in departmentOptions" :key="item" :label="item" :value="item" />
                </tiny-select>
              </tiny-form-item>

              <tiny-form-item prop="expenseDate">
                <div class="field-label">
                  报销日期 <span class="required-mark">*</span>
                  <span v-if="isAiFilled('expenseDate')" class="ai-badge">AI</span>
                </div>
                <tiny-date-picker v-model="formModel.expenseDate" class="field-control field-control--ai" value-format="yyyy-MM-dd" />
              </tiny-form-item>

              <tiny-form-item prop="currency">
                <div class="field-label">
                  币种 <span class="required-mark">*</span>
                  <span v-if="isAiFilled('currency')" class="ai-badge">AI</span>
                </div>
                <tiny-select v-model="formModel.currency" class="field-control field-control--ai" placeholder="请选择币种">
                  <tiny-option
                    v-for="item in currencyOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </tiny-select>
              </tiny-form-item>

              <div class="form-grid__spacer"></div>

              <tiny-form-item prop="reason" class="form-grid__full">
                <div class="field-label">报销事由</div>
                <tiny-input
                  v-model="formModel.reason"
                  class="field-control"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入详细的报销说明..."
                />
              </tiny-form-item>
            </div>
          </tiny-form>
        </tiny-card>

        <tiny-card class="section-card section-card--details">
          <div class="section-head section-head--tight">
            <h2 class="section-title section-title--caps">费用明细</h2>
            <button class="add-detail-button" @click="handleAddDetail">添加明细</button>
          </div>

          <div class="detail-table-shell">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>费用类别</th>
                  <th>日期</th>
                  <th>描述</th>
                  <th class="is-right">金额</th>
                  <th class="is-action"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detailRows" :key="row.id" :class="{ 'is-ai-row': row.source === 'ai' }">
                  <td>
                    <div class="category-cell">
                      <span>{{ row.category }}</span>
                      <span v-if="row.source === 'ai'" class="ai-badge">AI</span>
                    </div>
                  </td>
                  <td>{{ row.expenseDate }}</td>
                  <td>{{ row.description }}</td>
                  <td class="is-right">¥ {{ formatCurrency(row.amount) }}</td>
                  <td class="is-action">
                    <button class="link-button" @click="handleRemoveDetail(row.id)">删除</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3">总计</td>
                  <td class="is-right">¥ {{ formattedTotal }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </tiny-card>
      </div>

      <div class="expense-content-grid__side">
        <tiny-card class="section-card section-card--upload">
          <div class="section-head">
            <h2 class="section-title section-title--caps">智能提取 & 发票附件</h2>
            <tiny-tag type="info" size="mini" effect="light">
              AI 已提取 {{ latestReadySuggestion?.extractedCount || 0 }} 个字段
            </tiny-tag>
          </div>

          <tiny-file-upload
            drag
            class="invoice-upload"
            :multiple="false"
            :show-file-list="false"
            accept=".pdf,.png,.jpg,.jpeg"
            :http-request="handleUploadRequest"
          >
            <div class="upload-trigger">
              <div class="upload-icon">⬆</div>
              <div class="upload-title">点击或拖拽上传发票</div>
              <div class="upload-subtitle">支持 PDF、JPG、PNG，上传后会自动触发 OCR 解析</div>
            </div>
          </tiny-file-upload>

          <div class="attachment-list">
            <div
              v-for="attachment in attachments"
              :key="attachment.id"
              :class="['attachment-card', `is-${attachment.status}`]"
            >
              <div class="attachment-meta">
                <div class="attachment-icon">{{ attachment.type === 'pdf' ? 'PDF' : 'IMG' }}</div>
                <div class="attachment-body">
                  <strong>{{ attachment.name }}</strong>
                  <p>{{ attachment.message }}</p>
                </div>
              </div>
              <tiny-tag
                :type="attachment.status === 'ready' ? 'success' : 'warning'"
                size="mini"
                effect="light"
              >
                {{ attachment.status === 'ready' ? `已提取 ${attachment.extractedFields} 字段` : '解析中' }}
              </tiny-tag>
            </div>
          </div>

          <tiny-button class="confirm-button" @click="handleConfirmFill">
            确认并填充全部提取结果
          </tiny-button>
        </tiny-card>

        <tiny-card class="section-card section-card--review">
          <div class="section-head">
            <h2 class="section-title section-title--caps">智能校验摘要</h2>
            <tiny-tag :type="review.ready ? 'success' : 'warning'" size="mini" effect="light">
              {{ review.ready ? '可提交' : '待补齐' }}
            </tiny-tag>
          </div>

          <div class="review-section">
            <div class="review-stat">
              <span>当前总额</span>
              <strong>¥ {{ formattedTotal }}</strong>
            </div>
            <div class="review-stat">
              <span>缺失字段</span>
              <strong>{{ review.missingFields.length }}</strong>
            </div>
            <div class="review-stat">
              <span>预警条数</span>
              <strong>{{ review.warnings.length }}</strong>
            </div>
          </div>

          <ul class="review-list">
            <li v-for="item in reviewSummary" :key="item">{{ item }}</li>
          </ul>
        </tiny-card>

        <tiny-card title="报销提示" class="section-card policy-card">
          <ul class="policy-list">
            <li v-for="policy in expensePolicies" :key="policy">{{ policy }}</li>
          </ul>
        </tiny-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { TinyModal } from '@opentiny/vue'
import {
  buildInvoiceSuggestion,
  buildPolicyReview,
  calculateTotal,
  categoryOptions,
  createInitialFormModel,
  currencyOptions,
  departmentOptions,
  expensePolicies,
  formatCurrency,
  getDraftPayloadById,
  getMissingRequiredFields,
  type AttachmentRecord,
  type ExpenseDetailRow,
  type ExpenseFormModel,
  type InvoiceSuggestion
} from '../../mock'
import { useHostContext } from '../../platform/host-context'

const route = useRoute()
const { aiBridge } = useHostContext()
const formRef = ref()
const showAutofillToast = ref(true)
const toastMessage = ref('AI 已根据您的发票自动填写了部分详情，请检查确认。')
const aiFieldKeys = ref<Array<keyof ExpenseFormModel>>(['title', 'expenseDate', 'currency'])

const formModel = reactive<ExpenseFormModel>(createInitialFormModel())
const detailRows = ref<ExpenseDetailRow[]>([])
const attachments = ref<AttachmentRecord[]>([])

const formRules = reactive({
  title: [{ required: true, message: '请输入报销单标题', trigger: 'blur' }],
  department: [{ required: true, message: '请选择报销部门', trigger: 'change' }],
  expenseDate: [{ required: true, message: '请选择报销日期', trigger: 'change' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }]
})

const review = computed(() => buildPolicyReview(formModel, detailRows.value))
const formattedTotal = computed(() => formatCurrency(calculateTotal(detailRows.value)))

const reviewSummary = computed(() => {
  const items: string[] = []

  if (review.value.missingFields.length) {
    items.push(`仍缺少：${review.value.missingFields.join('、')}`)
  } else {
    items.push('必填字段已补齐。')
  }

  if (review.value.warnings.length) {
    items.push(...review.value.warnings)
  } else {
    items.push('当前未发现高风险审批预警。')
  }

  return items
})

const latestReadySuggestion = computed(() => {
  const match = [...attachments.value].reverse().find((item) => item.status === 'ready' && item.suggestion)

  return match?.suggestion
})

const hydrateByRoute = () => {
  const payload = getDraftPayloadById(typeof route.query.id === 'string' ? route.query.id : null)

  Object.assign(formModel, payload.form)
  detailRows.value = payload.detailRows
  attachments.value = payload.attachments
  aiFieldKeys.value = ['title', 'expenseDate', 'currency']
}

const isAiFilled = (field: keyof ExpenseFormModel) => aiFieldKeys.value.includes(field)

const replaceAiGeneratedRows = (suggestedRows: ExpenseDetailRow[]) => {
  const manualRows = detailRows.value.filter((row) => row.source !== 'ai')
  detailRows.value = [...suggestedRows.map((row) => ({ ...row, source: 'ai' as const })), ...manualRows]
}

const applySuggestion = (suggestion: InvoiceSuggestion, reason = 'AI 已根据发票完成字段回填。') => {
  formModel.title = suggestion.title
  formModel.department = suggestion.department
  formModel.expenseDate = suggestion.expenseDate
  formModel.currency = suggestion.currency
  if (!formModel.reason) {
    formModel.reason = suggestion.reason
  }

  replaceAiGeneratedRows(suggestion.detailRows)

  aiFieldKeys.value = ['title', 'department', 'expenseDate', 'currency']
  toastMessage.value = reason
  showAutofillToast.value = true

  window.setTimeout(() => {
    showAutofillToast.value = false
  }, 3200)
}

const handleSaveDraft = () => {
  TinyModal.message({ message: '草稿已保存到本地示例数据中。', status: 'success' })
}

const handleCancel = () => {
  TinyModal.message({ message: '当前是示例环境，已保留页面状态。', status: 'info' })
}

const handleSubmit = () => {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      TinyModal.message({ message: '请先补齐必填项后再提交。', status: 'warning' })
      return
    }

    if (!review.value.ready) {
      TinyModal.message({ message: '当前表单仍存在未完成项，请先处理智能校验摘要。', status: 'warning' })
      return
    }

    const warningText = review.value.warnings.length ? `\n${review.value.warnings.join('\n')}` : ''
    TinyModal.alert(`模拟提交成功，当前总额 ¥${formattedTotal.value}。${warningText}`)
  })
}

const handleAddDetail = () => {
  detailRows.value = [
    ...detailRows.value,
    {
      id: `detail-manual-${Date.now()}`,
      category: categoryOptions[0] ?? '交通费',
      expenseDate: formModel.expenseDate || new Date().toISOString().slice(0, 10),
      description: '手动新增费用明细',
      amount: 0,
      source: 'manual'
    }
  ]
}

const handleRemoveDetail = (id: string) => {
  detailRows.value = detailRows.value.filter((row) => row.id !== id)
}

const handleConfirmFill = () => {
  if (!latestReadySuggestion.value) {
    TinyModal.message({ message: '当前还没有可用于回填的解析结果。', status: 'warning' })
    return
  }

  applySuggestion(latestReadySuggestion.value, `AI 已根据 ${latestReadySuggestion.value.attachmentName} 完成回填。`)
  TinyModal.message({ message: '已根据发票结果更新表单。', status: 'success' })
}

const handleUploadRequest = (options: any) =>
  new Promise<void>((resolve) => {
    const fileName = options.file?.name || 'uploaded-invoice.pdf'
    const attachmentId = `att-${Date.now()}`

    attachments.value = [
      {
        id: attachmentId,
        name: fileName,
        status: 'processing',
        type: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
        message: 'AI 正在深度解析中...',
        extractedFields: 0
      },
      ...attachments.value
    ]

    window.setTimeout(() => {
      options.onSuccess?.({ message: '上传成功' })
      resolve()

      window.setTimeout(() => {
        const suggestion = buildInvoiceSuggestion(fileName)

        attachments.value = attachments.value.map((item) =>
          item.id === attachmentId
            ? {
                ...item,
                status: 'ready',
                message: '解析完成: 已同步至明细表',
                extractedFields: suggestion.extractedCount,
                suggestion
              }
            : item
        )

        toastMessage.value = `AI 已完成对 ${fileName} 的解析，可一键回填 ${suggestion.extractedCount} 个字段。`
        showAutofillToast.value = true
      }, 1200)
    }, 400)
  })

let cleanupPageTool: (() => void) | undefined

onMounted(() => {
  hydrateByRoute()

  cleanupPageTool = aiBridge.registerPageTool({
    route: '/expenses/new-ai',
    handlers: {
      expense_form_query: async () => {
        const missingFields = getMissingRequiredFields(formModel)

        return {
          content: [
            {
              type: 'text',
              text: [
                `当前报销单：${formModel.title || '未命名单据'}`,
                `部门：${formModel.department || '未填写'}`,
                `日期：${formModel.expenseDate || '未填写'}`,
                `币种：${formModel.currency || '未填写'}`,
                `明细条数：${detailRows.value.length}`,
                `总额：¥ ${formattedTotal.value}`,
                `附件状态：${attachments.value.map((item) => `${item.name}（${item.status === 'ready' ? '已解析' : '处理中'}）`).join('；') || '暂无附件'}`,
                missingFields.length ? `缺失字段：${missingFields.join('、')}` : '当前必填项已补齐。'
              ].join('\n')
            }
          ]
        }
      },
      expense_form_apply_invoice: async ({ attachmentName }: { attachmentName?: string }) => {
        const readyAttachment = attachments.value.find(
          (item) => item.name === attachmentName && item.status === 'ready' && item.suggestion
        )
        const suggestion = readyAttachment?.suggestion || latestReadySuggestion.value

        if (!suggestion) {
          return {
            content: [{ type: 'text', text: '当前没有可用于回填的已解析发票，请先上传并等待解析完成。' }]
          }
        }

        applySuggestion(suggestion, `AI 已根据 ${suggestion.attachmentName} 自动填写了部分详情，请检查确认。`)

        return {
          content: [
            {
              type: 'text',
              text: `已根据 ${suggestion.attachmentName} 回填标题、部门、日期、币种，并同步 ${suggestion.detailRows.length} 条费用明细。`
            }
          ]
        }
      },
      expense_form_add_detail: async ({
        category,
        expenseDate,
        description,
        amount
      }: {
        category: string
        expenseDate: string
        description: string
        amount: number
      }) => {
        detailRows.value = [
          ...detailRows.value,
          {
            id: `detail-ai-${Date.now()}`,
            category,
            expenseDate,
            description,
            amount,
            source: 'ai'
          }
        ]

        return {
          content: [
            {
              type: 'text',
              text: `已新增费用明细：${category}｜${description}｜¥ ${formatCurrency(amount)}。当前总额为 ¥ ${formatCurrency(calculateTotal(detailRows.value))}。`
            }
          ]
        }
      },
      expense_submit_readiness_check: async () => {
        return {
          content: [
            {
              type: 'text',
              text: reviewSummary.value.join('\n')
            }
          ]
        }
      }
    }
  })
})

watch(
  () => route.query.id,
  () => {
    hydrateByRoute()
  }
)

onUnmounted(() => {
  cleanupPageTool?.()
})
</script>

<style scoped>
.expense-form-page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: min(100%, 1180px);
  min-width: 0;
}

.ai-toast {
  position: absolute;
  top: 10px;
  left: 50%;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  background: rgba(0, 87, 195, 0.92);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 16px 28px rgba(0, 87, 195, 0.2);
  transform: translateX(-50%);
  backdrop-filter: blur(12px);
}

.ai-toast__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-top: 14px;
  padding-top: 10px;
}

.page-header h1 {
  margin: 0;
  font-size: 38px;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.page-header p {
  margin: 8px 0 0;
  color: #5c6272;
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions :deep(.header-btn) {
  min-width: 92px;
  height: 40px;
  padding: 0 18px;
  border-radius: 10px;
  border: 1px solid rgba(193, 198, 215, 0.48);
  background: #fff;
  color: #414755;
  font-size: 12px;
  font-weight: 700;
  box-shadow: none;
}

.header-actions :deep(.header-btn--ghost) {
  border-color: transparent;
  background: transparent;
}

.header-actions :deep(.header-btn--draft) {
  background: #eef2fb;
}

.header-actions :deep(.header-btn--primary) {
  border-color: transparent;
  background: linear-gradient(135deg, #0057c3 0%, #006ef3 100%);
  color: #fff;
  box-shadow: 0 12px 24px rgba(0, 87, 195, 0.16);
}

.expense-content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(290px, 0.88fr);
  gap: 20px;
  align-items: start;
}

.expense-content-grid__main,
.expense-content-grid__side {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.section-card {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(21, 28, 40, 0.04);
}

.section-card :deep(.tiny-card__body) {
  padding: 24px 24px 22px;
}

.audit-ribbon {
  border-left: 4px solid #505d6d;
}

.section-card--details :deep(.tiny-card__body) {
  padding: 24px;
}

.section-card--review :deep(.tiny-card__body),
.policy-card :deep(.tiny-card__body) {
  padding-top: 20px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.section-head--tight {
  margin-bottom: 18px;
}

.section-title {
  margin: 0;
  color: #151c28;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.section-title--caps {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #585e6d;
}

.expense-form {
  margin-top: 0;
}

.field-label {
  margin-bottom: 8px;
  color: #585e6d;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.required-mark {
  color: #ba1a1a;
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: 6px;
  background: #006ef3;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.field-control :deep(.tiny-input__inner),
.field-control :deep(.tiny-input__textarea),
.field-control :deep(.tiny-input),
.field-control :deep(.tiny-select),
.field-control :deep(.tiny-date-editor) {
  border-radius: 10px;
}

.field-control :deep(.tiny-input__inner),
.field-control :deep(.tiny-input__textarea) {
  background: #f1f3ff;
  border-color: transparent;
}

.field-control--ai :deep(.tiny-input__inner),
.field-control--ai :deep(.tiny-input__textarea),
.field-control--ai :deep(.tiny-input),
.field-control--ai :deep(.tiny-select .tiny-input__inner),
.field-control--ai :deep(.tiny-date-editor .tiny-input__inner) {
  background: #f0f4ff;
  border-color: #afc6ff;
  box-shadow: inset 0 0 0 1px rgba(0, 110, 243, 0.08);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 20px;
  margin-top: 4px;
}

.form-grid__full {
  grid-column: 1 / -1;
}

.form-grid__spacer {
  min-height: 1px;
}

.add-detail-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: #0057c3;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.detail-table-shell {
  width: 100%;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid rgba(221, 226, 244, 0.8);
}

.detail-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.detail-table thead th {
  padding: 11px 14px;
  background: #f1f3ff;
  color: #585e6d;
  text-align: left;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.detail-table tbody td {
  padding: 13px 14px;
  border-bottom: 1px solid #eef1fa;
}

.detail-table tbody tr.is-ai-row {
  background: rgba(0, 110, 243, 0.05);
}

.detail-table tfoot td {
  padding: 14px;
  background: rgba(0, 87, 195, 0.06);
  color: #0057c3;
  font-size: 14px;
  font-weight: 800;
}

.detail-table .is-right {
  text-align: right;
}

.detail-table .is-action {
  width: 72px;
  text-align: center;
}

.category-cell {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.link-button {
  border: none;
  background: transparent;
  color: #0057c3;
  cursor: pointer;
  font-weight: 700;
}

.invoice-upload :deep(.tiny-upload) {
  width: 100%;
}

.upload-trigger {
  padding: 28px 18px;
  text-align: center;
}

.upload-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #f1f3ff;
  color: #727786;
  font-size: 20px;
  font-weight: 700;
}

.upload-title {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 800;
}

.upload-subtitle {
  margin-top: 6px;
  color: #727786;
  font-size: 12px;
  line-height: 1.5;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.attachment-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(193, 198, 215, 0.35);
}

.attachment-card.is-processing {
  background: #f3f7ff;
}

.attachment-card.is-ready {
  background: #f9fbff;
  box-shadow: inset 0 0 0 1px rgba(0, 87, 195, 0.08);
}

.attachment-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.attachment-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #fff;
  color: #0057c3;
  font-size: 12px;
  font-weight: 800;
}

.attachment-body strong {
  display: block;
  font-size: 13px;
}

.attachment-body p {
  margin: 5px 0 0;
  color: #727786;
  font-size: 12px;
}

.confirm-button {
  width: 100%;
  margin-top: 16px;
}

.section-card--upload :deep(.confirm-button) {
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(0, 87, 195, 0.45);
  background: #fff;
  color: #0057c3;
  font-size: 12px;
  font-weight: 800;
  box-shadow: none;
}

.review-section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.review-stat {
  padding: 12px;
  border-radius: 10px;
  background: #f6f8ff;
}

.review-stat span {
  display: block;
  color: #727786;
  font-size: 12px;
}

.review-stat strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
  letter-spacing: -0.03em;
}

.review-list,
.policy-list {
  margin: 14px 0 0;
  padding-left: 18px;
  color: #505d6d;
}

.review-list li,
.policy-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.policy-card {
  background: linear-gradient(180deg, rgba(0, 87, 195, 0.05) 0%, rgba(0, 87, 195, 0.02) 100%);
}

@media (max-width: 1360px) {
  .expense-content-grid {
    grid-template-columns: 1fr;
  }
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.24s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
