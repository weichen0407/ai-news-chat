// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  },

  // Railway会自动设置PORT环境变量
  nitro: {
    preset: 'node-server'
  },

  app: {
    head: {
      title: 'AI微信聊天模拟器',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI微信聊天模拟器 - 多人在线版' }
      ],
      // 添加内联样式防止排版闪烁
      style: [
        {
          children: `
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            * { box-sizing: border-box; }
            .viewport { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; }
            [v-cloak] { display: none; }
          `,
          type: 'text/css'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  // 优化CSS加载
  vite: {
    css: {
      preprocessorOptions: {
        css: {
          additionalData: ''
        }
      }
    }
  },

  // 启用内联样式
  experimental: {
    inlineSSRStyles: true
  }
})

