import { registerNavigateTool } from '@opentiny/next-sdk'
import type { PageAwareServer, WebMcpServer } from '@opentiny/next-sdk'
import registerExpenseTools from './expense/tools'

export const registerAllTools = (server: PageAwareServer) => {
  registerNavigateTool(server as unknown as WebMcpServer)
  registerExpenseTools(server)
}
