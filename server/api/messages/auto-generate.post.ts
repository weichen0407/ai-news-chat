import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await getCurrentUser(event)
  
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { roomId, rounds = 1 } = body
  
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
    return { success: true, messages: [] }
  }
  
  // 获取最近的聊天记录
  const recentMessages = db.prepare(`
    SELECT sender_name, content, sender_type
    FROM messages
    WHERE room_id = ?
    ORDER BY created_at DESC
    LIMIT 15
  `).all(roomId) as any[]
  
  const chatHistory = recentMessages.reverse().map(m => `${m.sender_name}: ${m.content}`).join('\n')
  
  // 构建NPC信息
  const npcInfo = npcs.map(npc => `- ${npc.name}：${npc.profile}`).join('\n')
  
  console.log('=== 开始自主生成对话 ===')
  console.log('房间ID:', roomId)
  console.log('生成轮数:', rounds)
  console.log('NPC数量:', npcs.length)
  
  const allGeneratedMessages = []
  
  try {
    for (let round = 0; round < rounds; round++) {
      console.log(`\n--- 第 ${round + 1} 轮对话 ---`)
      
      // 获取当前最新的聊天历史
      const currentMessages = db.prepare(`
        SELECT sender_name, content
        FROM messages
        WHERE room_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).all(roomId) as any[]
      
      const currentHistory = currentMessages.reverse().map(m => `${m.sender_name}: ${m.content}`).join('\n')
      
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
              content: `你是一个群聊对话生成器。

【最高优先级-核心剧情】
事件背景：${room.event_background || '日常聊天'}

⚠️ 关键要求：所有对话必须围绕上述事件背景展开！这是剧情主线，不能偏离！

【角色信息】
${npcInfo}

【对话生成规则】
1. 所有对话必须与事件背景紧密相关，推动剧情发展
2. 根据当前对话内容和NPC性格，生成1-3条新对话
3. 优先让有矛盾、冲突的NPC发言
4. 对话要符合人设，有情绪、有态度
5. 可以是回复上一句话，也可以围绕事件背景主动提出新话题
6. 制造冲突和张力，让剧情更精彩
7. 语气要真实、口语化，像真人聊天
8. 可以使用语气词、表情、标点来表达情绪

输出格式（JSON数组）：
[
  {"npc_name": "NPC名字", "message": "对话内容", "emotion": "情绪(angry/sad/happy/calm)"},
  {"npc_name": "NPC名字", "message": "对话内容", "emotion": "情绪"}
]

如果剧情已经没有继续的必要，返回空数组[]`
            },
            {
              role: 'user',
              content: `当前对话历史：
${currentHistory || '（群聊刚刚开始）'}

请生成接下来的1-3条对话，让剧情继续发展：`
            }
          ],
          temperature: 0.9,
          max_tokens: 800
        })
      })
      
      if (!response.ok) {
        console.error('DeepSeek API调用失败:', response.status)
        break
      }
      
      const data = await response.json()
      const responseText = data.choices[0]?.message?.content?.trim() || '[]'
      console.log('AI回复:', responseText)
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.log('未找到JSON数组，停止生成')
        break
      }
      
      const parsedResponses = JSON.parse(jsonMatch[0])
      
      if (parsedResponses.length === 0) {
        console.log('AI认为对话已结束')
        break
      }
      
      // 保存生成的对话
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
          
          allGeneratedMessages.push({
            npcName: npc.name,
            message: resp.message,
            emotion: resp.emotion || 'calm'
          })
          
          console.log(`✓ ${npc.name} (${resp.emotion || 'calm'}): ${resp.message}`)
        }
      }
      
      // 每轮之间稍微延迟
      if (round < rounds - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log('=== 自主对话生成结束 ===')
    console.log(`共生成 ${allGeneratedMessages.length} 条对话\n`)
    
    return {
      success: true,
      messages: allGeneratedMessages
    }
  } catch (error) {
    console.error('自主生成对话失败:', error)
    return { success: false, error: '生成失败' }
  }
})

