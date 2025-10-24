// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
    public: {},
  },

  // Railway会自动设置PORT环境变量
  nitro: {
    preset: "node-server",
  },

  app: {
    head: {
      title: "AI微信聊天模拟器",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "AI微信聊天模拟器 - 多人在线版" },
      ],
      // 添加内联样式防止排版闪烁
      style: [
        {
          children: `
            html, body { 
              margin: 0; 
              padding: 0; 
              height: 100vh;
              width: 100vw;
              overflow: hidden;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            }
            * { box-sizing: border-box; }
            #__nuxt { height: 100vh; width: 100vw; overflow: hidden; }
            [v-cloak] { display: none; }
          `,
          type: "text/css",
        },
      ],
    },
  },

  css: ["~/assets/css/main.css"],

  // 启用内联样式
  experimental: {
    inlineSSRStyles: true,
    payloadExtraction: false,
  },

  // 禁用oxc-parser
  typescript: {
    typeCheck: false,
  },

  // 使用SWC替代oxc-parser
  vite: {
    css: {
      preprocessorOptions: {
        css: {
          additionalData: "",
        },
      },
    },
    esbuild: {
      target: "esnext",
    },
    optimizeDeps: {
      exclude: [
        "@oxc-parser/binding-darwin-arm64",
        "@oxc-parser/binding-darwin-universal",
        "@oxc-parser/binding-linux-x64-musl",
      ],
    },
  },

  // 使用SWC替代oxc-parser
  build: {
    transpile: ["@nuxt/kit"],
  },
});
