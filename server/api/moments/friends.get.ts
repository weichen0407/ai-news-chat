/**
 * 获取好友的朋友圈（基于加入的房间）
 */
import Database from 'better-sqlite3'
import { join } from 'path'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return { success: false, error: '请先登录' }
    }
    
    const query = getQuery(event)
    const limit = Number(query.limit) || 50
    const offset = Number(query.offset) || 0
    
    // 连接app.db获取好友NPC
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    // 获取用户的所有好友NPC（通过加入的房间）
    const friendNpcsStmt = appDb.prepare(`
      SELECT DISTINCT n.id, n.name, n.avatar, n.room_id
      FROM npcs n
      INNER JOIN room_members rm ON n.room_id = rm.room_id
      WHERE rm.user_id = ?
    `)
    const friendNpcs = friendNpcsStmt.all(user.id)
    const npcIds = friendNpcs.map((npc: any) => npc.id)
    
    // 获取用户的玩家好友
    const friendUsersStmt = appDb.prepare(`
      SELECT DISTINCT u.id, u.username, u.nickname, u.avatar
      FROM friendships f
      INNER JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?
    `)
    const friendUsers = friendUsersStmt.all(user.id)
    const friendUserIds = friendUsers.map((u: any) => u.id)
    
    console.log('🔍 用户', user.id, '的NPC好友:', npcIds)
    console.log('🔍 用户', user.id, '的玩家好友:', friendUserIds)
    
    appDb.close()
    
    // 连接chat.db获取朋友圈
    const momentsDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    
    // 构建查询：获取用户自己的、好友NPC的和玩家好友的朋友圈
    let query_str = `
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
      WHERE m.user_id = ?
    `
    
    const params: any[] = [user.id]
    
    // 如果有好友NPC，添加到查询条件
    if (npcIds.length > 0) {
      query_str += ` OR m.npc_id IN (${npcIds.map(() => '?').join(',')})`
      params.push(...npcIds)
    }
    
    // 如果有玩家好友，添加到查询条件
    if (friendUserIds.length > 0) {
      query_str += ` OR m.user_id IN (${friendUserIds.map(() => '?').join(',')})`
      params.push(...friendUserIds)
    }
    
    query_str += `
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, offset)
    
    const stmt = momentsDb.prepare(query_str)
    const moments = stmt.all(...params)
    
    // 获取NPC信息映射
    const npcMap = new Map()
    friendNpcs.forEach((npc: any) => {
      npcMap.set(npc.id, npc)
    })
    
    // 获取玩家好友信息映射
    const userMap = new Map()
    friendUsers.forEach((u: any) => {
      userMap.set(u.id, u)
    })
    
    // 重新连接app.db获取用户信息
    const appDb2 = new Database(join(process.cwd(), 'data', 'app.db'))
    
    // 填充用户和NPC信息
    const enrichedMoments = moments.map((moment: any) => {
      let authorInfo = {}
      
      if (moment.user_id) {
        const userInfo = appDb2.prepare('SELECT username, nickname, avatar FROM users WHERE id = ?').get(moment.user_id) as any
        if (userInfo) {
          authorInfo = {
            user_name: userInfo.username,
            user_nickname: userInfo.nickname,
            user_avatar: userInfo.avatar
          }
        }
      } else if (moment.npc_id) {
        const npc = npcMap.get(moment.npc_id)
        if (npc) {
          authorInfo = {
            npc_name: npc.name,
            npc_avatar: npc.avatar
          }
        }
      }
      
      // 获取点赞列表
      const likesStmt = momentsDb.prepare(`
        SELECT 
          ml.id,
          ml.user_id,
          ml.npc_id,
          ml.created_at
        FROM moment_likes ml
        WHERE ml.moment_id = ?
        ORDER BY ml.created_at DESC
      `)
      const likes = likesStmt.all(moment.id)
      
      // 填充点赞者信息
      const enrichedLikes = likes.map((like: any) => {
        if (like.user_id) {
          const userInfo = appDb2.prepare('SELECT username, nickname FROM users WHERE id = ?').get(like.user_id) as any
          return {
            ...like,
            user_name: userInfo?.username,
            user_nickname: userInfo?.nickname
          }
        } else if (like.npc_id) {
          const npc = npcMap.get(like.npc_id)
          return {
            ...like,
            npc_name: npc?.name
          }
        }
        return like
      })
      
      // 获取评论列表
      const commentsStmt = momentsDb.prepare(`
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
      `)
      const comments = commentsStmt.all(moment.id)
      
      // 过滤并填充评论者信息（只显示共同好友的评论）
      const enrichedComments = comments
        .filter((comment: any) => {
          // 允许查看的评论：
          // 1. 当前用户自己的评论
          if (comment.user_id === user.id) return true
          // 2. 朋友圈作者本人的评论
          if (moment.user_id && comment.user_id === moment.user_id) return true
          if (moment.npc_id && comment.npc_id === moment.npc_id) return true
          // 3. 当前用户的NPC好友的评论
          if (comment.npc_id && npcIds.includes(comment.npc_id)) return true
          // 4. 当前用户的玩家好友的评论
          if (comment.user_id && friendUserIds.includes(comment.user_id)) return true
          
          // 其他评论不显示
          return false
        })
        .map((comment: any) => {
          let commentInfo: any = { ...comment }
          
          if (comment.user_id) {
            const userInfo = appDb2.prepare('SELECT username, nickname FROM users WHERE id = ?').get(comment.user_id) as any
            commentInfo.user_name = userInfo?.username
            commentInfo.user_nickname = userInfo?.nickname
          } else if (comment.npc_id) {
            const npc = npcMap.get(comment.npc_id)
            commentInfo.npc_name = npc?.name
          }
          
          if (comment.reply_to_user_id) {
            const userInfo = appDb2.prepare('SELECT username, nickname FROM users WHERE id = ?').get(comment.reply_to_user_id) as any
            commentInfo.reply_to_user_name = userInfo?.username
            commentInfo.reply_to_user_nickname = userInfo?.nickname
          } else if (comment.reply_to_npc_id) {
            const npc = npcMap.get(comment.reply_to_npc_id)
            commentInfo.reply_to_npc_name = npc?.name
          }
          
          return commentInfo
        })
      
      return {
        ...moment,
        ...authorInfo,
        images: moment.images ? JSON.parse(moment.images) : [],
        likes: enrichedLikes,
        comments: enrichedComments
      }
    })
    
    appDb2.close()
    momentsDb.close()
    
    return {
      success: true,
      moments: enrichedMoments
    }
  } catch (error: any) {
    console.error('获取好友朋友圈失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

