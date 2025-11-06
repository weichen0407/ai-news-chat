import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

/**
 * 获取最近的玩家评论（用于管理后台）
 */
export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const db = getDB()
  
  try {
    // 检查表是否存在
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='moment_comments'
    `).get() as any
    
    if (!tableExists) {
      console.log('⚠️ moment_comments 表不存在，返回空列表')
      return {
        success: true,
        comments: []
      }
    }
    
    // 获取最近50条玩家的评论
    const comments = db.prepare(`
      SELECT 
        mc.id,
        mc.moment_id,
        mc.user_id,
        mc.content,
        mc.created_at,
        u.nickname as user_nickname,
        u.username as user_name,
        m.content as moment_content,
        m.npc_id as moment_npc_id,
        m.user_id as moment_user_id,
        CASE 
          WHEN m.npc_id IS NOT NULL THEN n.name
          WHEN m.user_id IS NOT NULL THEN u2.nickname
          ELSE '未知'
        END as moment_author_name
      FROM moment_comments mc
      JOIN users u ON mc.user_id = u.id
      JOIN moments m ON mc.moment_id = m.id
      LEFT JOIN npcs n ON m.npc_id = n.id
      LEFT JOIN users u2 ON m.user_id = u2.id
      WHERE mc.user_id IS NOT NULL
      ORDER BY mc.created_at DESC
      LIMIT 50
    `).all()
    
    return {
      success: true,
      comments
    }
  } catch (error) {
    console.error('获取玩家评论失败:', error)
    return {
      success: true,
      comments: [],
      warning: '朋友圈功能未启用'
    }
  }
})

