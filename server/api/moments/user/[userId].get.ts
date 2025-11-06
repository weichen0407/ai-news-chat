/**
 * 获取指定玩家的朋友圈
 */
import Database from 'better-sqlite3'
import { join } from 'path'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const currentUser = await getCurrentUser(event)
    if (!currentUser) {
      return { success: false, error: '请先登录' }
    }
    
    const userId = event.context.params?.userId
    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }
    
    // 连接数据库
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    
    try {
      // 获取目标用户信息
      const targetUser = appDb.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?').get(userId) as any
      
      if (!targetUser) {
        return { success: false, error: '用户不存在' }
      }
      
      // 获取当前用户的好友列表（用于过滤评论）
      // 1. 获取NPC好友（通过房间）
      const currentUserNpcFriends = appDb.prepare(`
        SELECT DISTINCT n.id
        FROM npcs n
        INNER JOIN room_members rm ON n.room_id = rm.room_id
        WHERE rm.user_id = ?
      `).all(currentUser.id)
      const currentUserNpcIds = currentUserNpcFriends.map((n: any) => n.id)
      
      // 2. 获取玩家好友
      const currentUserPlayerFriends = appDb.prepare(`
        SELECT friend_id FROM friendships WHERE user_id = ?
      `).all(currentUser.id)
      const currentUserFriendIds = currentUserPlayerFriends.map((f: any) => f.friend_id)
      
      console.log('🔍 当前用户', currentUser.id, '的NPC好友:', currentUserNpcIds)
      console.log('🔍 当前用户', currentUser.id, '的玩家好友:', currentUserFriendIds)
      
      // 获取该用户的朋友圈
      const moments = chatDb.prepare(`
        SELECT 
          m.*,
          (SELECT COUNT(*) FROM moment_likes WHERE moment_id = m.id) as like_count,
          (SELECT COUNT(*) FROM moment_comments WHERE moment_id = m.id) as comment_count
        FROM moments m
        WHERE m.user_id = ?
        ORDER BY m.created_at DESC
        LIMIT 50
      `).all(userId)
      
      // 获取每个朋友圈的点赞和评论
      const enrichedMoments = moments.map((moment: any) => {
        // 获取点赞列表
        const likes = chatDb.prepare(`
          SELECT 
            ml.id,
            ml.user_id,
            ml.npc_id,
            ml.created_at
          FROM moment_likes ml
          WHERE ml.moment_id = ?
          ORDER BY ml.created_at DESC
        `).all(moment.id)
        
        // 填充点赞者信息
        const enrichedLikes = likes.map((like: any) => {
          if (like.user_id) {
            const userInfo = appDb.prepare('SELECT username, nickname, avatar FROM users WHERE id = ?').get(like.user_id) as any
            return {
              ...like,
              user_name: userInfo?.username,
              user_nickname: userInfo?.nickname,
              user_avatar: userInfo?.avatar
            }
          } else if (like.npc_id) {
            const npcInfo = appDb.prepare('SELECT name, avatar FROM npcs WHERE id = ?').get(like.npc_id) as any
            return {
              ...like,
              npc_name: npcInfo?.name,
              npc_avatar: npcInfo?.avatar
            }
          }
          return like
        })
        
        // 获取评论列表
        const comments = chatDb.prepare(`
          SELECT 
            mc.id,
            mc.user_id,
            mc.npc_id,
            mc.reply_to_user_id,
            mc.reply_to_npc_id,
            mc.content,
            mc.created_at
          FROM moment_comments mc
          WHERE mc.moment_id = ?
          ORDER BY mc.created_at ASC
        `).all(moment.id)
        
        // 过滤并填充评论者信息（只显示共同好友的评论）
        const enrichedComments = comments
          .filter((comment: any) => {
            // 允许查看的评论：
            // 1. 当前用户自己的评论
            if (comment.user_id === currentUser.id) return true
            // 2. 朋友圈作者自己的评论
            if (comment.user_id === parseInt(userId)) return true
            // 3. 当前用户的NPC好友的评论
            if (comment.npc_id && currentUserNpcIds.includes(comment.npc_id)) return true
            // 4. 当前用户的玩家好友的评论
            if (comment.user_id && currentUserFriendIds.includes(comment.user_id)) return true
            
            // 其他评论不显示
            return false
          })
          .map((comment: any) => {
            let commentInfo: any = { ...comment }
            
            if (comment.user_id) {
              const userInfo = appDb.prepare('SELECT username, nickname, avatar FROM users WHERE id = ?').get(comment.user_id) as any
              commentInfo.user_name = userInfo?.username
              commentInfo.user_nickname = userInfo?.nickname
              commentInfo.user_avatar = userInfo?.avatar
            } else if (comment.npc_id) {
              const npcInfo = appDb.prepare('SELECT name, avatar FROM npcs WHERE id = ?').get(comment.npc_id) as any
              commentInfo.npc_name = npcInfo?.name
              commentInfo.npc_avatar = npcInfo?.avatar
            }
            
            if (comment.reply_to_user_id) {
              const userInfo = appDb.prepare('SELECT username, nickname FROM users WHERE id = ?').get(comment.reply_to_user_id) as any
              commentInfo.reply_to_user_name = userInfo?.username
              commentInfo.reply_to_user_nickname = userInfo?.nickname
            } else if (comment.reply_to_npc_id) {
              const npcInfo = appDb.prepare('SELECT name FROM npcs WHERE id = ?').get(comment.reply_to_npc_id) as any
              commentInfo.reply_to_npc_name = npcInfo?.name
            }
            
            return commentInfo
          })
        
        return {
          ...moment,
          user_name: targetUser.username,
          user_nickname: targetUser.nickname,
          user_avatar: targetUser.avatar,
          images: moment.images ? JSON.parse(moment.images) : [],
          likes: enrichedLikes,
          comments: enrichedComments
        }
      })
      
      return {
        success: true,
        user: targetUser,
        moments: enrichedMoments
      }
    } finally {
      appDb.close()
      chatDb.close()
    }
  } catch (error: any) {
    console.error('获取用户朋友圈失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

