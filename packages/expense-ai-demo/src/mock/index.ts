export type ExpenseStatus = '草稿' | '审批中' | '已驳回' | '已通过'

export interface ExpenseDetailRow {
  id: string
  category: string
  expenseDate: string
  description: string
  amount: number
  source?: 'manual' | 'ai'
}

export interface ExpenseFormModel {
  id: string
  title: string
  department: string
  expenseDate: string
  currency: string
  reason: string
  applicant: string
  tripLocation: string
  projectCode: string
}

export interface InvoiceSuggestion {
  attachmentName: string
  extractedCount: number
  title: string
  department: string
  expenseDate: string
  currency: string
  reason: string
  detailRows: ExpenseDetailRow[]
}

export interface AttachmentRecord {
  id: string
  name: string
  status: 'processing' | 'ready'
  type: 'pdf' | 'image'
  message: string
  extractedFields: number
  suggestion?: InvoiceSuggestion
}

export interface ExpenseDraft {
  id: string
  title: string
  applicant: string
  department: string
  totalAmount: number
  status: ExpenseStatus
  updatedAt: string
  detailCount: number
}

export interface DraftPayload {
  form: ExpenseFormModel
  detailRows: ExpenseDetailRow[]
  attachments: AttachmentRecord[]
}

export const departmentOptions = ['市场部', '财务部', '技术研发部', '人事行政部']

export const currencyOptions = [
  { label: 'CNY - 人民币', value: 'CNY - 人民币' },
  { label: 'USD - 美元', value: 'USD - 美元' },
  { label: 'EUR - 欧元', value: 'EUR - 欧元' }
]

export const categoryOptions = ['交通费', '住宿费', '餐饮费', '招待费', '办公费', '差旅补贴']

export const expensePolicies = [
  '单笔超过 ¥5,000 需要部门经理额外审批。',
  '请确保发票抬头为“XX技术有限公司”。',
  '电子发票请务必上传原始 PDF 文件。',
  '跨城市差旅默认需要绑定项目编号。'
]

export const departmentBudgetMap: Record<string, { monthlyBudget: number; used: number }> = {
  市场部: { monthlyBudget: 180000, used: 126800 },
  财务部: { monthlyBudget: 90000, used: 34800 },
  技术研发部: { monthlyBudget: 260000, used: 173600 },
  人事行政部: { monthlyBudget: 120000, used: 65800 }
}

const aiDetailRows = (): ExpenseDetailRow[] => [
  {
    id: 'detail-ai-1',
    category: '交通费',
    expenseDate: '2024-05-12',
    description: '上海至北京往返机票',
    amount: 2480,
    source: 'ai'
  },
  {
    id: 'detail-manual-1',
    category: '住宿费',
    expenseDate: '2024-05-13',
    description: '希尔顿酒店 2晚',
    amount: 1860,
    source: 'manual'
  }
]

export const buildInvoiceSuggestion = (attachmentName = 'Ticket_F2930.pdf'): InvoiceSuggestion => ({
  attachmentName,
  extractedCount: 4,
  title: '2024年Q3上海市场调研出差费用',
  department: '市场部',
  expenseDate: '2024-05-15',
  currency: 'CNY - 人民币',
  reason: '上海市场调研差旅及客户访谈产生的交通与住宿费用。',
  detailRows: aiDetailRows()
})

export const createInitialFormModel = (): ExpenseFormModel => ({
  id: 'EXP-2026-018',
  title: '2024年Q3上海市场调研出差费用',
  department: '市场部',
  expenseDate: '2024-05-15',
  currency: 'CNY - 人民币',
  reason: '',
  applicant: '林晓雨',
  tripLocation: '上海 / 北京',
  projectCode: 'MK-Q3-RESEARCH'
})

export const createInitialAttachments = (): AttachmentRecord[] => [
  {
    id: 'att-processing-1',
    name: 'IMG_20240512_102.jpg',
    status: 'processing',
    type: 'image',
    message: 'AI 正在深度解析中...',
    extractedFields: 0
  },
  {
    id: 'att-ready-1',
    name: 'Ticket_F2930.pdf',
    status: 'ready',
    type: 'pdf',
    message: '解析完成: 已同步至明细表',
    extractedFields: 4,
    suggestion: buildInvoiceSuggestion('Ticket_F2930.pdf')
  }
]

export const createInitialDraftPayload = (): DraftPayload => ({
  form: createInitialFormModel(),
  detailRows: aiDetailRows(),
  attachments: createInitialAttachments()
})

export const expenseDrafts: ExpenseDraft[] = [
  {
    id: 'EXP-2026-018',
    title: '2024年Q3上海市场调研出差费用',
    applicant: '林晓雨',
    department: '市场部',
    totalAmount: 4340,
    status: '草稿',
    updatedAt: '2026-03-22 10:18',
    detailCount: 2
  },
  {
    id: 'EXP-2026-012',
    title: '年度客户峰会差旅报销',
    applicant: '周明哲',
    department: '市场部',
    totalAmount: 8120,
    status: '审批中',
    updatedAt: '2026-03-21 18:42',
    detailCount: 4
  },
  {
    id: 'EXP-2026-007',
    title: '供应商驻场住宿费用',
    applicant: '陈婉清',
    department: '技术研发部',
    totalAmount: 5280,
    status: '已驳回',
    updatedAt: '2026-03-20 14:09',
    detailCount: 3
  }
]

const draftPayloadMap: Record<string, DraftPayload> = {
  'EXP-2026-018': createInitialDraftPayload(),
  'EXP-2026-012': {
    form: {
      ...createInitialFormModel(),
      id: 'EXP-2026-012',
      title: '年度客户峰会差旅报销',
      applicant: '周明哲',
      reason: '参加年度客户峰会并进行核心客户拜访。',
      projectCode: 'MK-SUMMIT-2026'
    },
    detailRows: [
      {
        id: 'detail-012-1',
        category: '交通费',
        expenseDate: '2026-03-18',
        description: '杭州至深圳往返高铁',
        amount: 1260,
        source: 'manual'
      },
      {
        id: 'detail-012-2',
        category: '住宿费',
        expenseDate: '2026-03-19',
        description: '会场酒店 2晚',
        amount: 3860,
        source: 'ai'
      },
      {
        id: 'detail-012-3',
        category: '餐饮费',
        expenseDate: '2026-03-19',
        description: '客户晚宴',
        amount: 3000,
        source: 'manual'
      }
    ],
    attachments: [
      {
        id: 'att-012-1',
        name: 'summit_invoice.pdf',
        status: 'ready',
        type: 'pdf',
        message: '解析完成: 已同步至明细表',
        extractedFields: 5,
        suggestion: {
          ...buildInvoiceSuggestion('summit_invoice.pdf'),
          title: '年度客户峰会差旅报销',
          detailRows: [
            {
              id: 'detail-012-suggest-1',
              category: '住宿费',
              expenseDate: '2026-03-19',
              description: '会场酒店 2晚',
              amount: 3860,
              source: 'ai'
            }
          ]
        }
      }
    ]
  }
}

export const cloneDraftPayload = (payload: DraftPayload): DraftPayload => ({
  form: { ...payload.form },
  detailRows: payload.detailRows.map((row) => ({ ...row })),
  attachments: payload.attachments.map((item) => ({
    ...item,
    suggestion: item.suggestion
      ? {
          ...item.suggestion,
          detailRows: item.suggestion.detailRows.map((row) => ({ ...row }))
        }
      : undefined
  }))
})

export const getDraftPayloadById = (id?: string | null): DraftPayload => {
  if (!id || !draftPayloadMap[id]) {
    return cloneDraftPayload(createInitialDraftPayload())
  }

  return cloneDraftPayload(draftPayloadMap[id])
}

export const getDraftById = (id?: string | null) => expenseDrafts.find((item) => item.id === id)

export const calculateTotal = (detailRows: ExpenseDetailRow[]) =>
  detailRows.reduce((sum, row) => sum + Number(row.amount || 0), 0)

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)

export const getMissingRequiredFields = (form: ExpenseFormModel) => {
  const entries: Array<[keyof ExpenseFormModel, string]> = [
    ['title', '报销单标题'],
    ['department', '报销部门'],
    ['expenseDate', '报销日期'],
    ['currency', '币种']
  ]

  return entries.filter(([field]) => !form[field]).map(([, label]) => label)
}

export const buildPolicyReview = (form: ExpenseFormModel, detailRows: ExpenseDetailRow[]) => {
  const totalAmount = calculateTotal(detailRows)
  const missingFields = getMissingRequiredFields(form)
  const warnings: string[] = []

  if (totalAmount > 5000) {
    warnings.push('当前报销单总额超过 ¥5,000，需要部门经理额外审批。')
  }

  if (!form.projectCode && form.department === '市场部') {
    warnings.push('市场部差旅报销建议补充项目编号，方便后续预算归集。')
  }

  const ready = missingFields.length === 0 && detailRows.length > 0

  return {
    ready,
    totalAmount,
    missingFields,
    warnings
  }
}
