import { getDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const db = getDB()
  
  try {
    // 获取所有有成员的活跃房间（24小时内有过消息）
    const activeRooms = db.prepare(`
      SELECT DISTINCT r.id, r.name, r.event_background
      FROM rooms r
      WHERE EXISTS (
        SELECT 1 FROM room_members WHERE room_id = r.id
      )
      AND EXISTS (
        SELECT 1 FROM messages 
        WHERE room_id = r.id 
        AND created_at > datetime('now', '-24 hours')
      )
      LIMIT 20
    `).all() as any[]
    
    let generatedCount = 0
    
    for (const room of activeRooms) {
      try {
        // 获取房间的NPC列表
        const npcs = db.prepare('SELECT * FROM npcs WHERE room_id = ?').all(room.id) as any[]
        
        if (npcs.length === 0) continue
        
        // 获取最近10条消息作为上下文
        const recentMessages = db.prepare(`
          SELECT sender_name, content 
          FROM messages 
          WHERE room_id = ? 
          ORDER BY created_at DESC 
          LIMIT 10
        `).all(room.id) as any[]
        
        const chatHistory = recentMessages.reverse().map(m => `${m.sender_name}: ${m.content}`).join('\n')
        
        // 调用AI生成1-2条对话
        const config = useRuntimeConfig()
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
                content: `你是一个智能助手，负责为群聊生成后续对话。

【事件背景-最高优先级】
${room.event_background}

【NPC角色】
${npcs.map(npc => `- ${npc.name}: ${npc.profile}`).join('\n')}

【要求】
1. 生成1-2条合理的后续对话
2. 必须严格围绕事件背景展开
3. 符合角色人设
4. 自然流畅，口语化
5. 每条对话格式：[角色名] 对话内容

【最近聊天记录】
${chatHistory || '（暂无）'}`
              },
              {
                role: 'user',
                content: '请生成1-2条后续对话，让群聊保持活跃。'
              }
            ],
            temperature: 0.8,
            max_tokens: 200
          })
        })
        
        if (!response.ok) {
          console.error(`房间${room.name}生成失败:`, response.status)
          continue
        }
        
        const data = await response.json() as any
        const generatedText = data.choices[0]?.message?.content || ''
        
        // 解析生成的对话
        const lines = generatedText.split('\n').filter(l => l.trim())
        
        for (const line of lines) {
          const match = line.match(/\[(.+?)\]\s*(.+)/)
          if (match) {
            const [, npcName, content] = match
            const npc = npcs.find(n => n.name.includes(npcName) || npcName.includes(n.name))
            
            if (npc && content.trim()) {
              // 保存消息
              db.prepare(`
                INSERT INTO messages (room_id, sender_type, sender_id, sender_name, avatar, content)
                VALUES (?, 'npc', ?, ?, ?, ?)
              `).run(room.id, npc.id, npc.name, npc.avatar, content.trim())
              
              generatedCount++
            }
          }
        }
      } catch (error) {
        console.error(`房间${room.name}处理失败:`, error)
      }
    }
    
    console.log(`✅ 后台任务完成：为${activeRooms.length}个房间生成了${generatedCount}条对话`)
    
    return {
      success: true,
      roomsProcessed: activeRooms.length,
      messagesGenerated: generatedCount
    }
  } catch (error) {
    console.error('后台任务失败:', error)
    return {
      success: false,
      error: String(error)
    }
  }
})

