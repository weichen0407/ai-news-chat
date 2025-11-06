import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

/**
 * 自动让同房间的NPC回复玩家的评论
 * 当玩家评论了某人的朋友圈时，触发该朋友圈作者所在房间的其他NPC也来回复
 */
export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const { commentId } = await readBody(event)
  
  if (!commentId) {
    return { success: false, error: '缺少评论ID' }
  }
  
  const db = getDB()
  
  try {
    // 1. 获取玩家的评论信息
    const comment = db.prepare(`
      SELECT 
        mc.*,
        m.npc_id as moment_npc_id,
        m.user_id as moment_user_id,
        m.content as moment_content
      FROM moment_comments mc
      JOIN moments m ON mc.moment_id = m.id
      WHERE mc.id = ?
    `).get(commentId) as any
    
    if (!comment) {
      return { success: false, error: '评论不存在' }
    }
    
    // 只处理玩家的评论
    if (!comment.user_id) {
      return { success: false, error: '只处理玩家的评论' }
    }
    
    console.log('📝 玩家评论信息:', comment)
    
    // 2. 确定被评论的朋友圈作者所在的房间
    let targetRoomIds: number[] = []
    
    if (comment.moment_npc_id) {
      // 朋友圈是NPC发的，找到该NPC所在的房间
      const npc = db.prepare('SELECT room_id FROM npcs WHERE id = ?').get(comment.moment_npc_id) as any
      if (npc && npc.room_id) {
        targetRoomIds.push(npc.room_id)
      }
    } else if (comment.moment_user_id) {
      // 朋友圈是玩家发的，找到该玩家加入的所有房间
      const rooms = db.prepare(`
        SELECT DISTINCT room_id 
        FROM room_members 
        WHERE user_id = ?
      `).all(comment.moment_user_id) as any[]
      targetRoomIds = rooms.map(r => r.room_id)
    }
    
    if (targetRoomIds.length === 0) {
      return { success: false, error: '未找到相关房间' }
    }
    
    console.log('🏠 目标房间:', targetRoomIds)
    
    // 3. 获取这些房间内的所有NPC（排除已经评论过的）
    const existingNPCComments = db.prepare(`
      SELECT DISTINCT npc_id 
      FROM moment_comments 
      WHERE moment_id = ? AND npc_id IS NOT NULL
    `).all(comment.moment_id) as any[]
    
    const existingNPCIds = existingNPCComments.map(c => c.npc_id)
    
    let npcQuery = `
      SELECT * FROM npcs 
      WHERE room_id IN (${targetRoomIds.join(',')})
    `
    
    if (existingNPCIds.length > 0) {
      npcQuery += ` AND id NOT IN (${existingNPCIds.join(',')})`
    }
    
    const npcsToReply = db.prepare(npcQuery).all() as any[]
    
    console.log('🤖 需要回复的NPC数量:', npcsToReply.length)
    console.log('🤖 NPC列表:', npcsToReply.map(n => n.name))
    
    if (npcsToReply.length === 0) {
      return { success: true, message: '没有需要回复的NPC', replies: [] }
    }
    
    // 4. 让这些NPC逐个回复玩家的评论
    const replies = []
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
    
    for (const npc of npcsToReply) {
      try {
        // 构建AI prompt
        const prompt = `你是${npc.name}。

【你的人设】
${npc.profile || npc.persona || '一个普通角色'}

【你的性格特点】
${npc.personality || '友好、真诚'}

【朋友圈内容】
${comment.moment_content}

【玩家的评论】
${comment.content}

现在，${npc.name}看到了这条评论，请根据你的人设和性格，对这条评论进行回复。

要求：
1. 回复要符合你的人设和性格特点
2. 回复要简短自然（10-50字）
3. 可以是赞同、调侃、补充、反驳等不同态度
4. 只返回回复内容，不要其他说明

回复内容：`

        console.log(`\n🤖 ${npc.name} 正在生成回复...`)
        console.log('📝 Prompt:', prompt)
        
        // 调用DeepSeek API
        const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.9,
            max_tokens: 200
          })
        })
        
        if (!aiResponse.ok) {
          console.error(`❌ ${npc.name} AI调用失败:`, aiResponse.status)
          continue
        }
        
        const aiData = await aiResponse.json()
        const replyContent = aiData.choices[0].message.content.trim()
        
        console.log(`✅ ${npc.name} 回复:`, replyContent)
        
        // 5. 保存NPC的回复到数据库
        const result = db.prepare(`
          INSERT INTO moment_comments (moment_id, npc_id, content, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `).run(comment.moment_id, npc.id, replyContent)
        
        replies.push({
          npc_id: npc.id,
          npc_name: npc.name,
          content: replyContent,
          comment_id: result.lastInsertRowid
        })
        
        // 随机延迟（模拟真实场景）
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
        
      } catch (error) {
        console.error(`❌ ${npc.name} 回复失败:`, error)
      }
    }
    
    console.log(`\n🎉 完成！共 ${replies.length} 个NPC回复了玩家的评论`)
    
    return {
      success: true,
      message: `${replies.length}个NPC已回复`,
      replies
    }
    
  } catch (error) {
    console.error('自动回复失败:', error)
    return { success: false, error: '自动回复失败' }
  }
})

