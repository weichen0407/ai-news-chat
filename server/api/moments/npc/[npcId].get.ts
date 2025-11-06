import Database from 'better-sqlite3'
import { join } from 'path'
import { getCurrentUser } from '~/server/utils/auth'

/**
 * 获取指定NPC的所有朋友圈（包括点赞和评论）
 */
export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const npcId = event.context.params?.npcId
  if (!npcId) {
    return { success: false, error: 'NPC ID不存在' }
  }
  
  // 使用chat.db（朋友圈数据库）
  const chatDbPath = join(process.cwd(), 'data', 'chat.db')
  const chatDb = new Database(chatDbPath)
  
  // 使用app.db（NPC和用户数据库）
  const appDbPath = join(process.cwd(), 'data', 'app.db')
  const appDb = new Database(appDbPath)
  
  try {
    // 从app.db获取NPC信息
    const npc = appDb.prepare('SELECT id, name, avatar FROM npcs WHERE id = ?').get(npcId) as any
    if (!npc) {
      chatDb.close()
      appDb.close()
      return { success: false, error: 'NPC不存在' }
    }
    
    // 获取当前用户的好友列表（用于过滤评论）
    // 1. 获取NPC好友（通过房间）
    const currentUserNpcFriends = appDb.prepare(`
      SELECT DISTINCT n.id
      FROM npcs n
      INNER JOIN room_members rm ON n.room_id = rm.room_id
      WHERE rm.user_id = ?
    `).all(user.id)
    const currentUserNpcIds = currentUserNpcFriends.map((n: any) => n.id)
    
    // 2. 获取玩家好友
    const currentUserPlayerFriends = appDb.prepare(`
      SELECT friend_id FROM friendships WHERE user_id = ?
    `).all(user.id)
    const currentUserFriendIds = currentUserPlayerFriends.map((f: any) => f.friend_id)
    
    console.log('🔍 查看NPC朋友圈 - 当前用户', user.id, '的NPC好友:', currentUserNpcIds)
    console.log('🔍 查看NPC朋友圈 - 当前用户', user.id, '的玩家好友:', currentUserFriendIds)
    
    // 从chat.db获取该NPC的所有朋友圈
    const moments = chatDb.prepare(`
      SELECT * FROM moments
      WHERE npc_id = ?
      ORDER BY created_at DESC
    `).all(npcId)
    
    console.log(`📝 查询NPC ${npc.name}(ID:${npcId}) 的朋友圈，共 ${moments.length} 条`)
    
    // 为每条朋友圈获取点赞和评论
    const momentsWithDetails = moments.map((moment: any) => {
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
      
      // 补充点赞者的名称
      const likesWithNames = likes.map((like: any) => {
        let name = '未知'
        if (like.user_id) {
          const user = appDb.prepare('SELECT nickname FROM users WHERE id = ?').get(like.user_id) as any
          name = user?.nickname || '未知'
        } else if (like.npc_id) {
          const likeNpc = appDb.prepare('SELECT name FROM npcs WHERE id = ?').get(like.npc_id) as any
          name = likeNpc?.name || '未知'
        }
        return { ...like, name }
      })
      
      // 获取评论列表
      const comments = chatDb.prepare(`
        SELECT 
          mc.id,
          mc.content,
          mc.created_at,
          mc.user_id,
          mc.npc_id
        FROM moment_comments mc
        WHERE mc.moment_id = ?
        ORDER BY mc.created_at ASC
      `).all(moment.id)
      
      // 过滤并补充评论者的名称和头像（只显示共同好友的评论）
      const commentsWithDetails = comments
        .filter((comment: any) => {
          // 允许查看的评论：
          // 1. 当前用户自己的评论
          if (comment.user_id === user.id) return true
          // 2. 朋友圈作者NPC本身的评论
          if (comment.npc_id === parseInt(npcId)) return true
          // 3. 当前用户的NPC好友的评论
          if (comment.npc_id && currentUserNpcIds.includes(comment.npc_id)) return true
          // 4. 当前用户的玩家好友的评论
          if (comment.user_id && currentUserFriendIds.includes(comment.user_id)) return true
          
          // 其他评论不显示
          return false
        })
        .map((comment: any) => {
          let author_name = '未知'
          let author_avatar = null
          
          if (comment.user_id) {
            const user = appDb.prepare('SELECT nickname, avatar FROM users WHERE id = ?').get(comment.user_id) as any
            author_name = user?.nickname || '未知'
            author_avatar = user?.avatar
          } else if (comment.npc_id) {
            const commentNpc = appDb.prepare('SELECT name, avatar FROM npcs WHERE id = ?').get(comment.npc_id) as any
            author_name = commentNpc?.name || '未知'
            author_avatar = commentNpc?.avatar
          }
          
          return {
            ...comment,
            author_name,
            author_avatar
          }
        })
      
      return {
        ...moment,
        author_name: npc.name,
        avatar: npc.avatar,
        likes: likesWithNames,
        comments: commentsWithDetails
      }
    })
    
    chatDb.close()
    appDb.close()
    
    return {
      success: true,
      moments: momentsWithDetails
    }
  } catch (error) {
    console.error('获取NPC朋友圈失败:', error)
    chatDb.close()
    appDb.close()
    return {
      success: false,
      error: '获取失败: ' + (error as Error).message
    }
  }
})

