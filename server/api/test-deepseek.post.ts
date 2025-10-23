export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  console.log("🧪 测试DeepSeek API调用");
  console.log("🔍 环境变量调试信息:");
  console.log(
    "- process.env.DEEPSEEK_API_KEY:",
    process.env.DEEPSEEK_API_KEY ? "已设置" : "未设置"
  );
  console.log(
    "- process.env.DEEPSEEK_API_KEY长度:",
    process.env.DEEPSEEK_API_KEY?.length || 0
  );
  console.log(
    "- config.deepseekApiKey:",
    config.deepseekApiKey ? "已设置" : "未设置"
  );
  console.log(
    "- config.deepseekApiKey长度:",
    config.deepseekApiKey?.length || 0
  );
  console.log(
    "- API密钥前缀:",
    config.deepseekApiKey?.substring(0, 10) || "undefined"
  );
  console.log("- Authorization头:", `Bearer ${config.deepseekApiKey}`);

  // 直接使用环境变量而不是runtimeConfig
  const apiKey = process.env.DEEPSEEK_API_KEY || config.deepseekApiKey;
  console.log("🔧 使用API密钥:", apiKey ? "已设置" : "未设置");
  console.log("🔧 API密钥长度:", apiKey?.length || 0);
  console.log("🔧 API密钥前缀:", apiKey?.substring(0, 10) || "undefined");

  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10,
        }),
      }
    );

    console.log("📡 API响应状态:", response.status);
    console.log(
      "📡 API响应头:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.ok) {
      const data = await response.json();
      console.log(
        "✅ API调用成功:",
        data.choices[0]?.message?.content || "无内容"
      );
      return {
        success: true,
        message: data.choices[0]?.message?.content || "无内容",
        status: response.status,
      };
    } else {
      const errorText = await response.text();
      console.log("❌ API调用失败:", response.status, errorText);
      return {
        success: false,
        error: `API调用失败: ${response.status} ${response.statusText}`,
        details: errorText,
        status: response.status,
      };
    }
  } catch (error) {
    console.log("💥 API调用异常:", error.message);
    return {
      success: false,
      error: `API调用异常: ${error.message}`,
      type: error.constructor.name,
    };
  }
});
