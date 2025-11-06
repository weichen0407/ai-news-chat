/**
 * 获取最近的朋友圈（用于管理后台）
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async () => {
  try {
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    const momentsDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    
    // 获取最近50条朋友圈
    const moments = momentsDb.prepare(`
      SELECT 
        id,
        user_id,
        npc_id,
        content,
        created_at,
        (SELECT COUNT(*) FROM moment_likes WHERE moment_id = id) as like_count,
        (SELECT COUNT(*) FROM moment_comments WHERE moment_id = id) as comment_count
      FROM moments
      ORDER BY created_at DESC
      LIMIT 50
    `).all()
    
    // 填充用户和NPC信息
    const enrichedMoments = moments.map((moment: any) => {
      if (moment.user_id) {
        const user = appDb.prepare('SELECT username, nickname, avatar FROM users WHERE id = ?').get(moment.user_id) as any
        return {
          ...moment,
          user_nickname: user?.nickname,
          user_name: user?.username,
          user_avatar: user?.avatar
        }
      } else if (moment.npc_id) {
        const npc = appDb.prepare('SELECT name, avatar FROM npcs WHERE id = ?').get(moment.npc_id) as any
        return {
          ...moment,
          npc_name: npc?.name,
          npc_avatar: npc?.avatar || '🤖'
        }
      }
      return moment
    })
    
    appDb.close()
    momentsDb.close()
    
    return {
      success: true,
      moments: enrichedMoments
    }
  } catch (error: any) {
    console.error('获取最近朋友圈失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

