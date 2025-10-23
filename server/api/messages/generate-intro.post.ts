import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await getCurrentUser(event)
  
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { roomId } = body
  
  if (!roomId) {
    return { success: false, error: '缺少房间ID' }
  }
  
  const db = getDB()
  
  // 获取房间信息
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any
  if (!room) {
    return { success: false, error: '房间不存在' }
  }
  
  // 获取NPC列表
  const npcs = db.prepare('SELECT * FROM npcs WHERE room_id = ?').all(roomId) as any[]
  if (npcs.length === 0) {
    return { success: false, error: '没有NPC' }
  }
  
  const npcInfo = npcs.map(npc => `- ${npc.name}：${npc.profile}`).join('\n')
  
  console.log('=== 生成开场对话 ===')
  
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || config.deepseekApiKey;
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个群聊开场对话生成器。

【核心剧情-最高优先级】
事件背景：${room.event_background || '日常聊天'}

⚠️ 关键：开场对话必须直接切入这个事件背景！不要铺垫太多，直接进入剧情主线！

【角色信息】
${npcInfo}

【生成规则】
1. 生成2-3条开场对话，直接引出事件背景
2. 开门见山，快速进入剧情主线
3. 对话要符合每个NPC的性格
4. 可以带有情绪、冲突，让剧情一开始就精彩
5. 为后续剧情发展做铺垫

输出格式（JSON数组）：
[
  {"npc_name": "NPC名字", "message": "对话内容"},
  {"npc_name": "NPC名字", "message": "对话内容"}
]`
          },
          {
            role: 'user',
            content: '请生成开场对话：'
          }
        ],
        temperature: 0.9,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      console.error('API调用失败:', response.status)
      return { success: false, error: 'AI服务调用失败' }
    }
    
    const data = await response.json()
    const responseText = data.choices[0]?.message?.content?.trim() || '[]'
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return { success: false, error: '生成失败' }
    }
    
    const parsedResponses = JSON.parse(jsonMatch[0])
    
    // 保存开场对话
    const insertMessage = db.prepare(
      'INSERT INTO messages (room_id, sender_type, sender_id, sender_name, avatar, content) VALUES (?, ?, ?, ?, ?, ?)'
    )
    
    for (const resp of parsedResponses) {
      const npc = npcs.find(n => n.name === resp.npc_name)
      if (npc) {
        insertMessage.run(
          roomId,
          'npc',
          npc.id,
          npc.name,
          npc.avatar || null,
          resp.message
        )
        console.log(`✓ ${npc.name}: ${resp.message}`)
      }
    }
    
    console.log('=== 开场对话生成完成 ===\n')
    
    return { success: true }
  } catch (error) {
    console.error('生成开场对话失败:', error)
    return { success: false, error: '生成失败' }
  }
})

