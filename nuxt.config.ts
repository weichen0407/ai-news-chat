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
      ]
    }
  },

  css: ['~/assets/css/main.css']
})

