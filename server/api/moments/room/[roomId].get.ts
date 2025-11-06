/**
 * 获取指定房间的朋友圈列表
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const roomId = event.context.params?.roomId
    
    if (!roomId) {
      return { success: false, error: '房间ID不能为空' }
    }
    
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    
    // 获取该房间的所有NPC
    const npcs = appDb.prepare(`
      SELECT id FROM npcs WHERE room_id = ?
    `).all(roomId)
    
    const npcIds = npcs.map((n: any) => n.id)
    
    if (npcIds.length === 0) {
      appDb.close()
      chatDb.close()
      return { success: true, moments: [] }
    }
    
    // 获取这些NPC发布的朋友圈
    const placeholders = npcIds.map(() => '?').join(',')
    const moments = chatDb.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.npc_id,
        m.content,
        m.images,
        m.created_at,
        (SELECT COUNT(*) FROM moment_likes WHERE moment_id = m.id) as like_count,
        (SELECT COUNT(*) FROM moment_comments WHERE moment_id = m.id) as comment_count
      FROM moments m
      WHERE m.npc_id IN (${placeholders})
      ORDER BY m.created_at DESC
      LIMIT 50
    `).all(...npcIds)
    
    // 补充作者信息
    const enrichedMoments = moments.map((moment: any) => {
      let author = '未知'
      
      if (moment.npc_id) {
        const npc = appDb.prepare(`SELECT name, avatar FROM npcs WHERE id = ?`).get(moment.npc_id) as any
        author = npc?.name || '未知NPC'
      } else if (moment.user_id) {
        const user = appDb.prepare(`SELECT nickname, username FROM users WHERE id = ?`).get(moment.user_id) as any
        author = user?.nickname || user?.username || '未知用户'
      }
      
      return {
        ...moment,
        author
      }
    })
    
    appDb.close()
    chatDb.close()
    
    return {
      success: true,
      moments: enrichedMoments
    }
  } catch (error: any) {
    console.error('获取房间朋友圈失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

