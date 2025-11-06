/**
 * 获取朋友圈统计信息
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async () => {
  try {
    const db = new Database(join(process.cwd(), 'data', 'chat.db'))
    
    // 总朋友圈数
    const totalMoments = db.prepare('SELECT COUNT(*) as count FROM moments').get() as any
    
    // NPC发布数
    const npcMoments = db.prepare('SELECT COUNT(*) as count FROM moments WHERE npc_id IS NOT NULL').get() as any
    
    // 玩家发布数
    const userMoments = db.prepare('SELECT COUNT(*) as count FROM moments WHERE user_id IS NOT NULL').get() as any
    
    // 总评论数
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM moment_comments').get() as any
    
    db.close()
    
    return {
      success: true,
      stats: {
        totalMoments: totalMoments.count,
        npcMoments: npcMoments.count,
        userMoments: userMoments.count,
        totalComments: totalComments.count
      }
    }
  } catch (error: any) {
    console.error('获取统计失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

