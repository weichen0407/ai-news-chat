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
    return { success: true, responses: [] }
  }
  
  // 获取最近的聊天记录
  const recentMessages = db.prepare(`
    SELECT sender_name, content
    FROM messages
    WHERE room_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(roomId) as any[]
  
  const chatHistory = recentMessages.reverse().map(m => `${m.sender_name}: ${m.content}`).join('\n')
  const lastMessage = recentMessages[recentMessages.length - 1]
  
  if (!lastMessage) {
    return { success: true, responses: [] }
  }
  
  // 构建NPC信息
  const npcInfo = npcs.map(npc => `- ${npc.name}：${npc.profile}`).join('\n')
  
  console.log('=== 开始生成NPC回复 ===')
  console.log('房间ID:', roomId)
  console.log('NPC数量:', npcs.length)
  console.log('NPC列表:', npcs.map(n => `${n.name}(ID:${n.id})`).join(', '))
  console.log('最后一条消息:', lastMessage.sender_name, ':', lastMessage.content)
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个真实群聊对话生成器。

【最高优先级-必须遵守的剧情设定】
事件背景：${room.event_background || '日常聊天'}

⚠️ 重要：你生成的所有对话必须严格围绕上述事件背景展开，不能脱离这个主线剧情！

【角色信息】
${npcInfo}

【生成规则】
1. 首先考虑事件背景，所有对话必须与主导剧情相关
2. 分析最新消息，判断哪1-2个NPC会回复
3. 回复要符合角色人设，展现真实的情绪和态度
4. 对话要推动剧情发展，不要偏离事件背景
4. 使用口语化表达，可以有语气词、标点、表情
5. 可以表现出：生气、讽刺、伤心、冷漠、激动等情绪
6. 如果有冲突，要敢于争吵和对抗
7. 像真人聊天一样，不要太官方、太礼貌

输出格式（JSON数组）：
[
  {"npc_name": "NPC名字", "message": "回复内容", "emotion": "情绪(angry/sad/happy/calm/sarcastic)"},
  {"npc_name": "NPC名字", "message": "回复内容", "emotion": "情绪"}
]

注意：
- npc_name必须完全匹配上面NPC信息中的名字
- 如果消息太无聊或不值得回复，返回空数组[]
- 情绪要真实，不要总是calm`
          },
          {
            role: 'user',
            content: `聊天历史：
${chatHistory}

最新消息：${lastMessage.sender_name}说"${lastMessage.content}"

请判断哪些NPC会回复：`
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API调用失败:', response.status, errorText)
      return { success: false, error: 'AI服务调用失败: ' + response.status }
    }
    
    const data = await response.json()
    console.log('AI返回数据:', JSON.stringify(data, null, 2))
    const responseText = data.choices[0]?.message?.content?.trim() || '[]'
    console.log('AI回复文本:', responseText)
    
    let responses = []
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      console.log('提取的JSON:', jsonMatch?.[0])
      
      if (jsonMatch) {
        const parsedResponses = JSON.parse(jsonMatch[0])
        console.log('解析后的响应:', parsedResponses)
        
        // 保存NPC回复到数据库
        const insertMessage = db.prepare(
          'INSERT INTO messages (room_id, sender_type, sender_id, sender_name, avatar, content) VALUES (?, ?, ?, ?, ?, ?)'
        )
        
        for (const resp of parsedResponses) {
          console.log('处理响应:', resp)
          const npc = npcs.find(n => n.name === resp.npc_name)
          console.log('找到的NPC:', npc)
          
          if (npc) {
            insertMessage.run(
              roomId,
              'npc',
              npc.id,
              npc.name,
              npc.avatar || null,
              resp.message
            )
            
            responses.push({
              npcId: npc.id,
              name: npc.name,
              avatar: npc.avatar,
              message: resp.message
            })
            console.log('已添加NPC回复:', npc.name)
          } else {
            console.error('未找到NPC，名字:', resp.npc_name, '可用的NPC名字:', npcs.map(n => n.name))
          }
        }
      } else {
        console.log('未匹配到JSON数组')
      }
    } catch (error) {
      console.error('解析JSON失败:', error, '原始文本:', responseText)
    }
    
    console.log('最终返回的响应数量:', responses.length)
    console.log('=== NPC回复生成结束 ===\n')
    
    return {
      success: true,
      responses
    }
  } catch (error) {
    console.error('生成NPC回复失败:', error)
    return { success: false, error: '生成回复失败' }
  }
})

