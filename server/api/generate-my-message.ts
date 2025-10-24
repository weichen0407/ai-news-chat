export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { command, myRole, chatHistory } = body;

  if (!command || !myRole) {
    return {
      success: false,
      error: "请提供命令和角色信息",
    };
  }

  try {
    // 构建聊天历史摘要
    const historyText = chatHistory
      .map((msg: any) => {
        return `${msg.name}: ${msg.text}`;
      })
      .join("\n");

    const apiKey = process.env.DEEPSEEK_API_KEY || config.deepseekApiKey;
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
          messages: [
            {
              role: "system",
              content: `你是一个角色扮演助手。用户会告诉你一个角色设定和一个行动指令，你需要生成这个角色会说的话。

要求：
1. 严格按照角色人设来生成对话
2. 对话要符合指令要求
3. 语言要自然、口语化
4. 只输出对话内容，不要添加任何解释或标点以外的内容
5. 对话长度控制在1-3句话`,
            },
            {
              role: "user",
              content: `角色设定：${myRole}

${historyText ? `聊天历史：\n${historyText}\n\n` : ""}行动指令：${command}

请生成${myRole}会说的话：`,
            },
          ],
          temperature: 0.9,
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API Error:", errorText);
      return {
        success: false,
        error: "AI服务调用失败",
      };
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content?.trim() || "";

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("生成消息失败:", error);
    return {
      success: false,
      error: "生成消息时出错，请重试",
    };
  }
});
