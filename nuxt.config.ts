// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  },

  app: {
    head: {
      title: 'AI对话生成器',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI模拟人物对话生成器' }
      ]
    }
  },

  css: ['~/assets/css/main.css']
})

