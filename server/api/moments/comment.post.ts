/**
 * 添加评论
 */
import { addComment } from '~/server/utils/db-moments'
import { getDB } from '~/server/utils/db'
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { moment_id, user_id, npc_id, reply_to_user_id, reply_to_npc_id, content } = body
    
    if (!moment_id || !content) {
      throw new Error('朋友圈ID和内容不能为空')
    }
    
    if (!user_id && !npc_id) {
      throw new Error('用户ID或NPC ID至少提供一个')
    }
    
    const commentId = addComment({
      moment_id,
      user_id,
      npc_id,
      reply_to_user_id,
      reply_to_npc_id,
      content
    })
    
    // 触发NPC自动回复（异步，不阻塞用户）
    // 无论是直接评论朋友圈，还是回复评论，都触发
    if (user_id && commentId) {
      console.log('🔔 触发NPC自动回复，评论ID:', commentId)
      console.log('📋 评论信息 - user_id:', user_id, 'moment_id:', moment_id)
      if (reply_to_npc_id) {
        console.log('📋 这是回复NPC评论:', reply_to_npc_id)
      }
      if (reply_to_user_id) {
        console.log('📋 这是回复用户评论:', reply_to_user_id)
      }
      
      // 使用 Promise 异步执行，避免阻塞用户请求
      triggerNPCAutoReply(commentId).catch(err => {
        console.error('❌ NPC自动回复失败:', err)
      })
    }
    
    return {
      success: true,
      commentId
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

// NPC自动回复逻辑
async function triggerNPCAutoReply(commentId: number) {
  // 连接两个数据库
  const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))
  const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
  
  try {
    console.log('🤖 开始NPC自动回复流程，评论ID:', commentId)
    
    // 1. 获取玩家的评论信息（从 chat.db）
    const comment = chatDb.prepare(`
      SELECT 
        mc.*,
        m.npc_id as moment_npc_id,
        m.user_id as moment_user_id,
        m.content as moment_content
      FROM moment_comments mc
      JOIN moments m ON mc.moment_id = m.id
      WHERE mc.id = ?
    `).get(commentId) as any
    
    if (!comment || !comment.user_id) {
      console.log('❌ 不是玩家的评论或评论不存在')
      return
    }
    
    console.log('📝 玩家评论信息:', {
      commentId: comment.id,
      moment_id: comment.moment_id,
      moment_author_npc_id: comment.moment_npc_id,
      moment_author_user_id: comment.moment_user_id
    })
    
    // 2. 确定应该回复的房间（从 app.db）
    // 核心逻辑：只有发朋友圈的人所在的房间的NPC才应该回复
    let targetRoomId: string | null = null
    
    // 情况1：如果朋友圈是NPC发的，只有该NPC所在房间的其他NPC回复
    if (comment.moment_npc_id) {
      const npc = appDb.prepare('SELECT room_id FROM npcs WHERE id = ?').get(comment.moment_npc_id) as any
      if (npc && npc.room_id) {
        targetRoomId = npc.room_id
        console.log('🏠 朋友圈作者是NPC，房间ID:', targetRoomId)
      }
    }
    
    // 情况2：如果朋友圈是玩家发的，找到该玩家当前所在的房间（这里简化逻辑，只取第一个房间）
    // 实际上应该根据朋友圈的上下文确定是哪个房间，但目前我们假设玩家只在一个主要房间活动
    else if (comment.moment_user_id) {
      const rooms = appDb.prepare(`
        SELECT room_id 
        FROM room_members 
        WHERE user_id = ?
        LIMIT 1
      `).all(comment.moment_user_id) as any[]
      
      if (rooms.length > 0) {
        targetRoomId = rooms[0].room_id
        console.log('🏠 朋友圈作者是玩家，取其第一个房间ID:', targetRoomId)
      }
    }
    
    if (!targetRoomId) {
      console.log('❌ 未找到相关房间')
      return
    }
    
    // 3. 获取该房间内的所有NPC（排除已经评论过的，以及朋友圈作者本人）
    const existingNPCComments = chatDb.prepare(`
      SELECT DISTINCT npc_id 
      FROM moment_comments 
      WHERE moment_id = ? AND npc_id IS NOT NULL
    `).all(comment.moment_id) as any[]
    
    const existingNPCIds = existingNPCComments.map(c => c.npc_id)
    
    // 排除朋友圈作者NPC
    if (comment.moment_npc_id) {
      existingNPCIds.push(comment.moment_npc_id)
    }
    
    let npcQuery = `
      SELECT * FROM npcs 
      WHERE room_id = ?
    `
    
    const npcParams = [targetRoomId]
    
    if (existingNPCIds.length > 0) {
      npcQuery += ` AND id NOT IN (${existingNPCIds.map(() => '?').join(',')})`
      npcParams.push(...existingNPCIds)
    }
    
    // 限制每次最多3个NPC回复，避免刷屏
    npcQuery += ` LIMIT 3`
    
    const npcsToReply = appDb.prepare(npcQuery).all(...npcParams) as any[]
    
    console.log('🤖 需要回复的NPC数量:', npcsToReply.length)
    console.log('🤖 NPC列表:', npcsToReply.map(n => `${n.name}(${n.id})`))
    
    if (npcsToReply.length === 0) {
      console.log('ℹ️ 没有需要回复的NPC')
      return
    }
    
    // 4. 让这些NPC逐个回复玩家的评论
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
    
    if (!DEEPSEEK_API_KEY) {
      console.error('❌ DeepSeek API密钥未配置')
      return
    }
    
    for (const npc of npcsToReply) {
      try {
        console.log(`\n🤖 ${npc.name} 正在生成回复...`)
        
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
1. 语气要符合你的人设和性格
2. 回复要简短、自然，1-2句话即可
3. 可以提出问题、表达观点或情绪
4. 直接输出回复内容，不要添加任何前缀`
        
        // 调用DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: '你是一个角色扮演AI，需要根据给定的人设来回复评论。'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.9,
            max_tokens: 150
          })
        })
        
        if (!response.ok) {
          console.error(`❌ ${npc.name} 调用AI失败:`, response.status)
          continue
        }
        
        const data = await response.json()
        const replyContent = data.choices[0]?.message?.content?.trim()
        
        if (!replyContent) {
          console.error(`❌ ${npc.name} AI返回内容为空`)
          continue
        }
        
        console.log(`✅ ${npc.name} 生成的回复:`, replyContent)
        
        // 添加NPC的回复到数据库
        const npcCommentId = addComment({
          moment_id: comment.moment_id,
          npc_id: npc.id,
          reply_to_user_id: comment.user_id,
          content: replyContent
        })
        
        console.log(`✅ ${npc.name} 的回复已添加到数据库，评论ID:`, npcCommentId)
        
        // 随机延迟，模拟真实回复间隔（1-3秒）
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
        
      } catch (error) {
        console.error(`❌ ${npc.name} 回复失败:`, error)
      }
    }
    
    console.log('✅ NPC自动回复流程完成')
    
  } catch (error) {
    console.error('❌ NPC自动回复流程异常:', error)
  } finally {
    // 关闭数据库连接
    chatDb.close()
    appDb.close()
  }
}

