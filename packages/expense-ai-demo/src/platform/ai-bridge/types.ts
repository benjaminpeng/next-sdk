import type { McpServerConfig } from '@opentiny/next-sdk'

type TextToolContent = {
  type: 'text'
  text: string
}

export type PageToolResult = {
  content: TextToolContent[]
}

export type PageToolHandler<TArgs = Record<string, any>> = (args: TArgs) => Promise<PageToolResult>

export type RegisterPageToolOptions = {
  route: string
  handlers: Record<string, PageToolHandler>
}

export interface AiBridge {
  boot(): Promise<void>
  navigate(route: string): Promise<void>
  registerPageTool(options: RegisterPageToolOptions): () => void
  getMcpServers(): Record<string, McpServerConfig>
}

export interface HostContext {
  aiBridge: AiBridge
  navigate(route: string): Promise<void>
}
