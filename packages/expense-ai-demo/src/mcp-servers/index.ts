import { WebMcpServer, createMessageChannelPairTransport, withPageTools } from '@opentiny/next-sdk'
import { registerAllTools } from './common'

const rawServer = new WebMcpServer()
const [serverTransport, clientTransport] = createMessageChannelPairTransport()

export const server = withPageTools(rawServer)
export { clientTransport }

let isConnected = false

export const createMcpServer = async () => {
  if (isConnected) return

  isConnected = true
  registerAllTools(server)
  await rawServer.connect(serverTransport)
}
