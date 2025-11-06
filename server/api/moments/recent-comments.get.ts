/**
 * 获取最近的评论记录（包括被评论的朋友圈内容）
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number(query.limit) || 50

  const chatDb = new Database(join(process.cwd(), 'data', 'chat.db'))
  const appDb = new Database(join(process.cwd(), 'data', 'app.db'))

  try {
    // 获取最近的评论
    const comments = chatDb.prepare(`
      SELECT 
        mc.id,
        mc.moment_id,
        mc.user_id,
        mc.npc_id,
        mc.reply_to_user_id,
        mc.reply_to_npc_id,
        mc.content,
        mc.created_at,
        m.content as moment_content,
        m.user_id as moment_user_id,
        m.npc_id as moment_npc_id
      FROM moment_comments mc
      LEFT JOIN moments m ON mc.moment_id = m.id
      ORDER BY mc.created_at DESC
      LIMIT ?
    `).all(limit) as any[]

    // 获取所有相关的 user_id 和 npc_id
    const userIds = new Set<number>()
    const npcIds = new Set<number>()

    comments.forEach(c => {
      if (c.user_id) userIds.add(c.user_id)
      if (c.npc_id) npcIds.add(c.npc_id)
      if (c.reply_to_user_id) userIds.add(c.reply_to_user_id)
      if (c.reply_to_npc_id) npcIds.add(c.reply_to_npc_id)
      if (c.moment_user_id) userIds.add(c.moment_user_id)
      if (c.moment_npc_id) npcIds.add(c.moment_npc_id)
    })

    // 批量查询用户和NPC信息
    const users = new Map()
    const npcs = new Map()

    if (userIds.size > 0) {
      const userList = appDb.prepare(`
        SELECT id, username, nickname, avatar
        FROM users
        WHERE id IN (${Array.from(userIds).join(',')})
      `).all() as any[]
      
      userList.forEach(u => {
        users.set(u.id, u)
      })
    }

    if (npcIds.size > 0) {
      const npcList = appDb.prepare(`
        SELECT id, name, avatar
        FROM npcs
        WHERE id IN (${Array.from(npcIds).join(',')})
      `).all() as any[]
      
      npcList.forEach(n => {
        npcs.set(n.id, n)
      })
    }

    // 组装数据
    const enrichedComments = comments.map(c => {
      const result: any = {
        id: c.id,
        moment_id: c.moment_id,
        content: c.content,
        created_at: c.created_at,
        moment_content: c.moment_content || '（朋友圈已删除）',
      }

      // 评论者信息
      if (c.user_id) {
        const user = users.get(c.user_id)
        result.author_type = 'user'
        result.author_name = user?.nickname || user?.username || '未知用户'
        result.author_avatar = user?.avatar
      } else if (c.npc_id) {
        const npc = npcs.get(c.npc_id)
        result.author_type = 'npc'
        result.author_name = npc?.name || '未知NPC'
        result.author_avatar = npc?.avatar
      }

      // 朋友圈作者信息
      if (c.moment_user_id) {
        const user = users.get(c.moment_user_id)
        result.moment_author = user?.nickname || user?.username || '未知用户'
      } else if (c.moment_npc_id) {
        const npc = npcs.get(c.moment_npc_id)
        result.moment_author = npc?.name || '未知NPC'
      }

      // 回复对象信息
      if (c.reply_to_user_id) {
        const user = users.get(c.reply_to_user_id)
        result.reply_to_author = user?.nickname || user?.username || '未知用户'
        
        // 查找被回复的评论内容
        const replyToComment = chatDb.prepare(`
          SELECT content FROM moment_comments 
          WHERE moment_id = ? AND user_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `).get(c.moment_id, c.reply_to_user_id) as any
        result.reply_to_content = replyToComment?.content
      } else if (c.reply_to_npc_id) {
        const npc = npcs.get(c.reply_to_npc_id)
        result.reply_to_author = npc?.name || '未知NPC'
        
        // 查找被回复的评论内容
        const replyToComment = chatDb.prepare(`
          SELECT content FROM moment_comments 
          WHERE moment_id = ? AND npc_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `).get(c.moment_id, c.reply_to_npc_id) as any
        result.reply_to_content = replyToComment?.content
      }

      return result
    })

    chatDb.close()
    appDb.close()

    return {
      success: true,
      comments: enrichedComments
    }
  } catch (error: any) {
    chatDb.close()
    appDb.close()
    
    console.error('获取最近评论失败:', error)
    return {
      success: false,
      error: error.message,
      comments: []
    }
  }
})

