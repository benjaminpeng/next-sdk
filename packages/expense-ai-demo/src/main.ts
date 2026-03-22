import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createAiBridge } from './platform/ai-bridge/runtime'
import { provideHostContext } from './platform/host-context'
import './style.css'

const app = createApp(App)
const aiBridge = createAiBridge(router)

app.use(router)
provideHostContext(app, {
  aiBridge,
  navigate: aiBridge.navigate
})
app.mount('#app')

void aiBridge.boot()
