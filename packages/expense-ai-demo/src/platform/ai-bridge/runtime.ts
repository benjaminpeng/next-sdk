import { isNavigationFailure, type Router } from 'vue-router'
import { registerPageTool, setNavigator } from '@opentiny/next-sdk'
import { LOCAL_SERVER_NAME } from '../../const'
import { clientTransport, createMcpServer } from '../../mcp-servers'
import type { AiBridge, RegisterPageToolOptions } from './types'

export const createAiBridge = (router: Router): AiBridge => {
  let bootPromise: Promise<void> | null = null

  const navigate = async (route: string) => {
    const failure = await router.push(route)

    if (isNavigationFailure(failure)) {
      throw new Error('页面跳转失败')
    }
  }

  const boot = async () => {
    if (!bootPromise) {
      setNavigator(navigate)
      bootPromise = createMcpServer()
    }

    await bootPromise
  }

  const getMcpServers = () => ({
    [LOCAL_SERVER_NAME]: {
      type: 'local' as const,
      transport: clientTransport
    }
  })

  return {
    boot,
    navigate,
    registerPageTool(options: RegisterPageToolOptions) {
      return registerPageTool(options)
    },
    getMcpServers
  }
}
