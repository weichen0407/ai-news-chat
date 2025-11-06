/**
 * 自动评论：NPC智能回复最近的朋友圈和评论（包括玩家的）
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    // 获取最近10分钟内的朋友圈（未评论或评论少于3条的）
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const recentMoments = chatDb.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.npc_id,
        (SELECT COUNT(*) FROM moment_comments WHERE moment_id = m.id) as comment_count
      FROM moments m
      WHERE m.created_at > ?
      ORDER BY m.created_at DESC
      LIMIT 20
    `).all(tenMinutesAgo)
    
    // 筛选出评论少于3条的朋友圈
    const momentsToComment = recentMoments.filter((m: any) => m.comment_count < 3)
    
    if (momentsToComment.length === 0) {
      chatDb.close()
      appDb.close()
      return { success: true, count: 0, message: '没有需要评论的朋友圈' }
    }
    
    // 获取所有NPC
    const allNpcs = appDb.prepare(`SELECT id, room_id FROM npcs`).all()
    appDb.close()
    chatDb.close()
    
    const results = []
    let commentCount = 0
    
    // 为每个朋友圈随机选择1-2个NPC评论
    for (const moment of momentsToComment.slice(0, 5)) { // 最多处理5条朋友圈
      const numCommentsToAdd = Math.floor(Math.random() * 2) + 1
      
      for (let i = 0; i < numCommentsToAdd; i++) {
        const randomNpc = allNpcs[Math.floor(Math.random() * allNpcs.length)] as any
        
        try {
          const response = await $fetch('/api/moments/ai-comment', {
            method: 'POST',
            body: {
              moment_id: (moment as any).id,
              npc_id: randomNpc.id
            }
          })
          
          if (response.success) {
            commentCount++
            results.push(response)
          }
        } catch (error) {
          console.error(`NPC ${randomNpc.id} 评论失败:`, error)
        }
        
        // 避免过于频繁，添加小延迟
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return {
      success: true,
      count: commentCount,
      processed: Math.min(momentsToComment.length, 5)
    }
  } catch (error: any) {
    console.error('自动评论失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

