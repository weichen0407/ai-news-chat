/**
 * 获取朋友圈通知
 * 检测回复"我"或"我"参与过的评论的新评论
 */
import Database from 'better-sqlite3'
import { join } from 'path'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getCurrentUser(event)
    if (!user) {
      return { success: false, error: '未登录' }
    }
    
    const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    // 获取用户最后查看朋友圈的时间
    const lastCheckStmt = chatDb.prepare(`
      SELECT last_check_at FROM moment_notification_status 
      WHERE user_id = ?
    `)
    const lastCheck = lastCheckStmt.get(user.id) as any
    const lastCheckTime = lastCheck?.last_check_at || new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    
    // 查找新的通知
    const notifications = []
    
    // 1. 直接回复我发布的朋友圈的评论
    const myMomentsComments = chatDb.prepare(`
      SELECT 
        mc.id as comment_id,
        mc.moment_id,
        mc.content as comment_content,
        mc.npc_id,
        mc.created_at,
        m.content as moment_content
      FROM moment_comments mc
      JOIN moments m ON mc.moment_id = m.id
      WHERE m.user_id = ?
        AND mc.created_at > ?
        AND mc.user_id IS NULL
      ORDER BY mc.created_at DESC
      LIMIT 20
    `).all(user.id, lastCheckTime)
    
    // 2. 回复我发表的评论
    const myCommentsReplies = chatDb.prepare(`
      SELECT 
        mc.id as comment_id,
        mc.moment_id,
        mc.content as comment_content,
        mc.npc_id,
        mc.created_at,
        m.content as moment_content
      FROM moment_comments mc
      JOIN moments m ON mc.moment_id = m.id
      WHERE mc.reply_to_user_id = ?
        AND mc.created_at > ?
      ORDER BY mc.created_at DESC
      LIMIT 20
    `).all(user.id, lastCheckTime)
    
    // 3. 我参与过的朋友圈的新评论
    const participatedMoments = chatDb.prepare(`
      SELECT DISTINCT moment_id FROM moment_comments 
      WHERE user_id = ?
    `).all(user.id)
    
    const participatedMomentIds = participatedMoments.map((m: any) => m.moment_id)
    
    let participatedComments = []
    if (participatedMomentIds.length > 0) {
      const placeholders = participatedMomentIds.map(() => '?').join(',')
      participatedComments = chatDb.prepare(`
        SELECT 
          mc.id as comment_id,
          mc.moment_id,
          mc.content as comment_content,
          mc.npc_id,
          mc.user_id as commenter_user_id,
          mc.created_at,
          m.content as moment_content
        FROM moment_comments mc
        JOIN moments m ON mc.moment_id = m.id
        WHERE mc.moment_id IN (${placeholders})
          AND mc.created_at > ?
          AND mc.user_id != ?
        ORDER BY mc.created_at DESC
        LIMIT 20
      `).all(...participatedMomentIds, lastCheckTime, user.id)
    }
    
    // 合并所有通知并补充NPC信息
    const allComments = [
      ...myMomentsComments,
      ...myCommentsReplies,
      ...participatedComments
    ]
    
    const enrichedNotifications = allComments.map((comment: any) => {
      let authorName = '未知'
      let authorAvatar = '👤'
      let type = 'comment'
      
      if (comment.npc_id) {
        const npc = appDb.prepare(`SELECT name, avatar FROM npcs WHERE id = ?`).get(comment.npc_id) as any
        authorName = npc?.name || '未知NPC'
        authorAvatar = npc?.avatar || '🤖'
      } else if (comment.commenter_user_id) {
        const userInfo = appDb.prepare(`SELECT username, nickname, avatar FROM users WHERE id = ?`).get(comment.commenter_user_id) as any
        authorName = userInfo?.nickname || userInfo?.username || '未知用户'
        authorAvatar = userInfo?.avatar || '👤'
      }
      
      // 判断类型
      if (myMomentsComments.some((c: any) => c.comment_id === comment.comment_id)) {
        type = 'moment_comment'
      } else if (myCommentsReplies.some((c: any) => c.comment_id === comment.comment_id)) {
        type = 'reply'
      } else {
        type = 'participated'
      }
      
      return {
        id: comment.comment_id,
        moment_id: comment.moment_id,
        type,
        author_name: authorName,
        author_avatar: authorAvatar,
        comment_content: comment.comment_content,
        moment_content: comment.moment_content?.substring(0, 30) + '...',
        created_at: comment.created_at
      }
    })
    
    // 去重
    const uniqueNotifications = []
    const seen = new Set()
    for (const notif of enrichedNotifications) {
      if (!seen.has(notif.id)) {
        seen.add(notif.id)
        uniqueNotifications.push(notif)
      }
    }
    
    chatDb.close()
    appDb.close()
    
    return {
      success: true,
      notifications: uniqueNotifications.slice(0, 10),
      unreadCount: uniqueNotifications.length
    }
  } catch (error: any) {
    console.error('获取通知失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

