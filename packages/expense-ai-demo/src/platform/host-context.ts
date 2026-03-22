import { inject, type App as VueApp, type InjectionKey } from 'vue'
import type { HostContext } from './ai-bridge/types'

export const HOST_CONTEXT_KEY: InjectionKey<HostContext> = Symbol('expense-ai-demo-host-context')

export const provideHostContext = (app: VueApp, hostContext: HostContext) => {
  app.provide(HOST_CONTEXT_KEY, hostContext)
}

export const useHostContext = () => {
  const hostContext = inject(HOST_CONTEXT_KEY)

  if (!hostContext) {
    throw new Error('Host context 尚未注入，请检查主应用或 loader 初始化流程。')
  }

  return hostContext
}
