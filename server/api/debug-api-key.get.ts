export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // 检查API密钥
  const apiKey = config.deepseekApiKey;
  const apiKeyLength = apiKey ? apiKey.length : 0;
  const apiKeyPrefix = apiKey ? apiKey.substring(0, 10) : "undefined";
  const apiKeySuffix = apiKey
    ? apiKey.substring(apiKey.length - 10)
    : "undefined";

  // 测试API调用
  let testResult = "未测试";
  let testError = null;

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
          max_tokens: 5,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      testResult = `成功: ${data.choices[0]?.message?.content || "无内容"}`;
    } else {
      const errorText = await response.text();
      testResult = `失败: ${response.status} ${response.statusText}`;
      testError = errorText;
    }
  } catch (error) {
    testResult = `异常: ${error.message}`;
    testError = error.message;
  }

  return {
    apiKey: {
      exists: !!apiKey,
      length: apiKeyLength,
      prefix: apiKeyPrefix,
      suffix: apiKeySuffix,
      full: apiKey, // 注意：生产环境不要暴露完整密钥
    },
    testResult,
    testError,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };
});
