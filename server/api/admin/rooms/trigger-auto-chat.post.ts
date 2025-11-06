import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'
import { canGenerate, recordTokenUsage, estimateTokens } from '~/server/utils/auto-control'

export default defineEventHandler(async (event) => {
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
  
  // 检查自动模式是否开启
  if (room.auto_mode !== 1) {
    return { success: false, error: '该房间未开启自动模式' }
  }
  
  // 智能控制检查
  const checkResult = canGenerate()
  if (!checkResult.allowed) {
    console.log(`⏸️ 房间 ${roomId} 自动生成被阻止: ${checkResult.reason}`)
    return { success: false, error: checkResult.reason, blocked: true }
  }
  
  try {
    // 直接生成对话（不通过API调用，避免session问题）
    const config = useRuntimeConfig()
    
    // 获取NPC列表
    const npcs = db.prepare('SELECT * FROM npcs WHERE room_id = ?').all(roomId) as any[]
    if (npcs.length === 0) {
      return { success: true, messages: [], warning: '房间内没有NPC' }
    }
    
    // 获取最近的聊天记录
    const recentMessages = db.prepare(`
      SELECT sender_name, content, sender_type
      FROM messages
      WHERE room_id = ?
      ORDER BY created_at DESC
      LIMIT 15
    `).all(roomId) as any[]
    
    const chatHistory = recentMessages
      .reverse()
      .map((m) => `${m.sender_name}: ${m.content}`)
      .join('\n')
    
    // 构建NPC信息
    const npcInfo = npcs.map((npc) => `- ${npc.name}：${npc.profile}`).join('\n')
    
    // 生成prompt
    const prompt = `你是一个群聊对话生成器。当前群聊：${room.name}

参与NPC：
${npcInfo}

最近对话历史：
${chatHistory || '（暂无历史）'}

请生成1-2条自然的群聊对话。要求：
1. 根据NPC人设生成
2. 对话要自然、有趣
3. 可以互相回应或提出新话题
4. 不要生成过于严肃或死板的对话

返回JSON数组格式：
[{"npc_name": "NPC名字", "message": "对话内容", "emotion": "情绪"}]`

    // 调用DeepSeek API
    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的群聊对话生成器，擅长生成自然、有趣的对话。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    })
    
    if (!apiResponse.ok) {
      throw new Error('AI服务调用失败')
    }
    
    const apiData = await apiResponse.json()
    const generatedText = apiData.choices[0]?.message?.content || ''
    
    // 解析JSON
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('AI返回格式错误')
    }
    
    const parsedResponses = JSON.parse(jsonMatch[0])
    
    // 保存生成的对话
    const insertMessage = db.prepare(
      'INSERT INTO messages (room_id, sender_type, sender_id, sender_name, avatar, content) VALUES (?, ?, ?, ?, ?, ?)'
    )
    
    const allMessages = []
    for (const resp of parsedResponses) {
      const npc = npcs.find((n) => n.name === resp.npc_name)
      if (npc) {
        insertMessage.run(
          roomId,
          'npc',
          npc.id,
          npc.name,
          npc.avatar || null,
          resp.message
        )
        
        allMessages.push({
          npcName: npc.name,
          message: resp.message,
          emotion: resp.emotion || 'calm'
        })
        
        console.log(`✓ ${npc.name}: ${resp.message}`)
      }
    }
    
    console.log(`✅ 房间 ${roomId} (${room.name}) 生成了 ${allMessages.length} 条对话`)
    
    // 记录token使用
    const totalTokens = allMessages.reduce((sum, msg) => {
      return sum + estimateTokens(msg.message)
    }, 0)
    const estimatedTotal = totalTokens * 3
    recordTokenUsage(estimatedTotal)
    
    return {
      success: true,
      messages: allMessages
    }
  } catch (error: any) {
    console.error('触发自动对话失败:', error)
    return { success: false, error: error.message || '生成失败' }
  }
})

