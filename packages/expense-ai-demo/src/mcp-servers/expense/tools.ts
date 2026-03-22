import { z } from '@opentiny/next-sdk'
import type { PageAwareServer } from '@opentiny/next-sdk'
import { departmentBudgetMap, expenseDrafts, expensePolicies } from '../../mock'

export default function registerExpenseTools(server: PageAwareServer) {
  server.registerTool(
    'expense_policy_query',
    {
      title: '查询报销规则',
      description:
        '【费用政策工具】查询报销审批规则、发票要求和高额报销注意事项，可结合金额或费用类别给出针对性的提醒。',
      inputSchema: {
        amount: z.number().optional().describe('可选，报销金额，用于判断是否命中高额审批规则'),
        category: z.string().optional().describe('可选，费用类别，例如交通费、住宿费、餐饮费')
      }
    },
    async ({ amount, category }: { amount?: number; category?: string }) => {
      const hints = [...expensePolicies]

      if (category) {
        hints.push(`当前关注费用类别：${category}。请确认票据内容与费用类别一致。`)
      }

      if (typeof amount === 'number' && amount > 5000) {
        hints.unshift(`金额 ¥${amount.toFixed(2)} 超过高额审批阈值，需要经理加签。`)
      }

      return {
        content: [
          {
            type: 'text',
            text: `报销规则摘要：\n${hints.map((item) => `- ${item}`).join('\n')}`
          }
        ]
      }
    }
  )

  server.registerTool(
    'expense_budget_snapshot',
    {
      title: '查询部门预算',
      description: '【预算工具】查询某个部门的月度预算、已用额度和剩余额度，辅助判断报销单是否需要预算预警。',
      inputSchema: {
        department: z.string().describe('部门名称，例如市场部、技术研发部')
      }
    },
    async ({ department }: { department: string }) => {
      const snapshot = departmentBudgetMap[department]

      if (!snapshot) {
        return {
          content: [{ type: 'text', text: `未找到 ${department} 的预算快照。` }]
        }
      }

      const remain = snapshot.monthlyBudget - snapshot.used

      return {
        content: [
          {
            type: 'text',
            text: `${department} 本月预算为 ¥${snapshot.monthlyBudget.toLocaleString()}，已用 ¥${snapshot.used.toLocaleString()}，剩余 ¥${remain.toLocaleString()}。`
          }
        ]
      }
    }
  )

  server.registerTool(
    'expense_list_query',
    {
      title: '查询报销单列表',
      description: '【报销列表工具】按关键字或状态筛选当前报销单列表，可用于快速定位草稿、审批中或驳回的单据。',
      inputSchema: {
        keyword: z.string().optional().describe('可选，按报销标题、申请人或报销单号模糊筛选'),
        status: z.enum(['草稿', '审批中', '已驳回', '已通过']).optional().describe('可选，按报销状态筛选')
      }
    },
    {
      route: '/expenses',
      invokeEffect: {
        label: '正在为你筛选报销单列表…'
      }
    }
  )

  server.registerTool(
    'expense_open_draft',
    {
      title: '打开报销单草稿',
      description: '【报销列表工具】根据报销单号打开指定草稿或单据详情页面。',
      inputSchema: {
        expenseId: z
          .string()
          .describe(`报销单号，如 ${expenseDrafts[0]?.id || 'EXP-2026-018'}`)
      }
    },
    {
      route: '/expenses',
      invokeEffect: {
        label: '正在为你打开目标报销单…'
      }
    }
  )

  server.registerTool(
    'expense_form_query',
    {
      title: '读取当前报销单',
      description: '【报销表单工具】读取当前表单的核心字段、明细总额、附件状态和缺失项。',
      inputSchema: {}
    },
    {
      route: '/expenses/new-ai',
      invokeEffect: {
        label: '正在读取当前报销单内容…'
      }
    }
  )

  server.registerTool(
    'expense_form_apply_invoice',
    {
      title: '根据发票智能填充',
      description: '【报销表单工具】读取当前页面中已上传并解析完成的发票结果，回填标题、日期、币种和费用明细。',
      inputSchema: {
        attachmentName: z.string().optional().describe('可选，指定要使用的附件名称；不传则使用最新已解析完成的附件')
      }
    },
    {
      route: '/expenses/new-ai',
      invokeEffect: {
        label: '正在根据发票智能填充表单…'
      }
    }
  )

  server.registerTool(
    'expense_form_add_detail',
    {
      title: '新增费用明细',
      description: '【报销表单工具】向当前报销单追加一条费用明细，用于 AI 根据自然语言补录项目。',
      inputSchema: {
        category: z.string().describe('费用类别，例如交通费、住宿费'),
        expenseDate: z.string().describe('费用发生日期，格式 YYYY-MM-DD'),
        description: z.string().describe('费用描述'),
        amount: z.number().describe('费用金额')
      }
    },
    {
      route: '/expenses/new-ai',
      invokeEffect: {
        label: '正在追加费用明细…'
      }
    }
  )

  server.registerTool(
    'expense_submit_readiness_check',
    {
      title: '提交前校验',
      description: '【报销表单工具】在提交审批前检查缺失字段、审批预警和预算风险。',
      inputSchema: {}
    },
    {
      route: '/expenses/new-ai',
      invokeEffect: {
        label: '正在检查提交前风险…'
      }
    }
  )
}
