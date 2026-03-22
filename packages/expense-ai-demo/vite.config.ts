import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { TinyVueSingleResolver } from '@opentiny/unplugin-tiny-vue'
import { VantResolver } from '@vant/auto-import-resolver'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  base: '/expense-ai-demo/',
  plugins: [
    vue(),
    svgLoader({
      defaultImport: 'component',
      svgo: false
    }),
    Components({
      dts: 'components.d.ts',
      resolvers: [TinyVueSingleResolver, VantResolver()]
    }),
    AutoImport({
      dts: 'auto-imports.d.ts',
      imports: ['vue', 'vue-router'],
      resolvers: [TinyVueSingleResolver, VantResolver()]
    })
  ],
  server: {
    host: true,
    port: 8091
  }
})
