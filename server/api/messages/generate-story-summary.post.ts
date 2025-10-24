import { getCurrentUser } from "~/server/utils/auth";
import { getDB } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const user = await getCurrentUser(event);

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const body = await readBody(event);
  const { roomId, originalBackground, currentBackground, recentMessages } = body;

  if (!roomId) {
    return { success: false, error: "缺少房间ID" };
  }

  const db = getDB();

  // 获取房间信息
  const room = db
    .prepare("SELECT * FROM rooms WHERE id = ?")
    .get(roomId) as any;
  if (!room) {
    return { success: false, error: "房间不存在" };
  }

  try {
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
              content: `你是一个剧情分析师。请根据聊天记录和剧情背景，生成一个简洁的剧情发展摘要。

要求：
1. 总结最近剧情的主要发展
2. 分析角色关系和冲突
3. 识别关键事件和转折点
4. 保持客观中立
5. 控制在200字以内
6. 用简洁的语言描述`,
            },
            {
              role: "user",
              content: `原始剧情背景：
${originalBackground || "无"}

当前剧情背景：
${currentBackground || "无"}

最近聊天记录：
${recentMessages || "无"}

请生成剧情发展摘要：`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API调用失败:", response.status, errorText);
      return {
        success: false,
        error: `AI服务调用失败: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim() || "";

    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error("生成剧情摘要失败:", error);
    return { success: false, error: "生成摘要失败" };
  }
});
