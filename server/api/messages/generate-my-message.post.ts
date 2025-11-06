import { getCurrentUser } from "~/server/utils/auth";
import { getDB } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const user = await getCurrentUser(event);

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const body = await readBody(event);
  const { roomId, command } = body;

  if (!roomId || !command) {
    return { success: false, error: "缺少必要参数" };
  }

  const db = getDB();

  // 获取房间信息
  const room = db
    .prepare("SELECT * FROM rooms WHERE id = ?")
    .get(roomId) as any;
  if (!room) {
    return { success: false, error: "房间不存在" };
  }

  // 获取 jerry 用户的 ID
  const jerryUser = db.prepare('SELECT id FROM users WHERE username = ?').get('jerry') as any;
  const isPresetRoom = jerryUser && room.creator_id === jerryUser.id;

  // 获取我的角色信息
  let member = db
    .prepare(
      "SELECT role_name, role_profile FROM room_members WHERE room_id = ? AND user_id = ?"
    )
    .get(roomId, user.id) as any;

  // 如果不是预设房间且不是成员，返回错误
  if (!isPresetRoom && !member) {
    return { success: false, error: "你不是该房间成员" };
  }

  // 如果是预设房间但没有成员记录，使用默认值
  if (isPresetRoom && !member) {
    member = {
      role_name: user.nickname,
      role_profile: "普通用户"
    };
  }

  // 获取最近聊天记录
  const recentMessages = db
    .prepare(
      `
    SELECT sender_name, content
    FROM messages
    WHERE room_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `
    )
    .all(roomId) as any[];

  const chatHistory = recentMessages
    .reverse()
    .map((m) => `${m.sender_name}: ${m.content}`)
    .join("\n");

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
              content: `你是一个角色扮演助手。

【当前剧情背景-必须遵守】
事件背景：${room.event_background || "日常聊天"}

⚠️ 重要：生成的对话必须与上述事件背景相关！

要求：
1. 所有对话必须围绕事件背景展开
2. 严格按照角色人设生成对话
3. 符合用户的指令要求
4. 语言自然、口语化
5. 1-3句话
6. 只输出对话内容`,
            },
            {
              role: "user",
              content: `角色：${member.role_name || user.nickname}
人设：${member.role_profile || "普通用户"}

${chatHistory ? `聊天历史：\n${chatHistory}\n\n` : ""}用户指令：${command}

请根据事件背景和角色人设，生成该角色会说的话：`,
            },
          ],
          temperature: 0.9,
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: "AI服务调用失败" };
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content?.trim() || "";

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("生成消息失败:", error);
    return { success: false, error: "生成消息失败" };
  }
});
