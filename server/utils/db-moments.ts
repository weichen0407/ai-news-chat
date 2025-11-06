/**
 * 朋友圈数据库操作
 */
import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'data', 'chat.db')

// 初始化朋友圈相关表
export function initMomentsTables() {
  const db = new Database(dbPath)
  
  try {
    // 朋友圈内容表
    db.exec(`
      CREATE TABLE IF NOT EXISTS moments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        user_id INTEGER,
        npc_id INTEGER,
        content TEXT NOT NULL,
        images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(room_id)
      )
    `)
    
    // 朋友圈点赞表
    db.exec(`
      CREATE TABLE IF NOT EXISTS moment_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        moment_id INTEGER NOT NULL,
        user_id INTEGER,
        npc_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (moment_id) REFERENCES moments(id),
        UNIQUE(moment_id, user_id, npc_id)
      )
    `)
    
    // 朋友圈评论表
    db.exec(`
      CREATE TABLE IF NOT EXISTS moment_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        moment_id INTEGER NOT NULL,
        user_id INTEGER,
        npc_id INTEGER,
        reply_to_user_id INTEGER,
        reply_to_npc_id INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (moment_id) REFERENCES moments(id)
      )
    `)
    
    // 朋友圈已读状态表
    db.exec(`
      CREATE TABLE IF NOT EXISTS moment_read_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        room_id TEXT NOT NULL,
        last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(room_id),
        UNIQUE(user_id, room_id)
      )
    `)
    
    // 朋友圈通知状态表
    db.exec(`
      CREATE TABLE IF NOT EXISTS moment_notification_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        last_check_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('✅ 朋友圈数据表初始化成功')
  } catch (error) {
    console.error('❌ 朋友圈数据表初始化失败:', error)
    throw error
  } finally {
    db.close()
  }
}

// 创建朋友圈（不再绑定到特定房间）
export function createMoment(data: {
  user_id?: number
  npc_id?: number
  content: string
  images?: string[]
}) {
  const db = new Database(dbPath)
  
  try {
    const stmt = db.prepare(`
      INSERT INTO moments (user_id, npc_id, content, images, room_id)
      VALUES (?, ?, ?, ?, NULL)
    `)
    
    const result = stmt.run(
      data.user_id || null,
      data.npc_id || null,
      data.content,
      data.images ? JSON.stringify(data.images) : null
    )
    
    return result.lastInsertRowid
  } finally {
    db.close()
  }
}

// 获取用户好友的朋友圈（基于加入的房间和好友关系）
export function getFriendsMoments(userId: number, limit = 50, offset = 0) {
  const db = new Database(join(process.cwd(), 'data', 'app.db'))
  
  try {
    // 获取用户的所有好友NPC（通过加入的房间）
    const friendNpcsStmt = db.prepare(`
      SELECT DISTINCT n.id, n.name, n.avatar
      FROM npcs n
      INNER JOIN room_members rm ON n.room_id = rm.room_id
      WHERE rm.user_id = ?
    `)
    const friendNpcs = friendNpcsStmt.all(userId)
    const npcIds = friendNpcs.map((npc: any) => npc.id)
    
    // 获取用户的好友（玩家）
    const friendUsersStmt = db.prepare(`
      SELECT friend_id FROM friendships WHERE user_id = ?
    `)
    const friendUsers = friendUsersStmt.all(userId)
    const friendUserIds = friendUsers.map((f: any) => f.friend_id)
    
    db.close()
    
    // 切换到moments数据库
    const momentsDb = new Database(join(process.cwd(), 'data', 'chat.db'))
    
    // 构建查询：获取用户自己的、好友NPC的和好友用户的朋友圈
    let query = `
      SELECT 
        m.*,
        (SELECT COUNT(*) FROM moment_likes WHERE moment_id = m.id) as like_count,
        (SELECT COUNT(*) FROM moment_comments WHERE moment_id = m.id) as comment_count
      FROM moments m
      WHERE m.user_id = ?
    `
    
    const params: any[] = [userId]
    
    // 如果有好友NPC，添加到查询条件
    if (npcIds.length > 0) {
      query += ` OR m.npc_id IN (${npcIds.map(() => '?').join(',')})`
      params.push(...npcIds)
    }
    
    // 如果有好友用户，添加到查询条件
    if (friendUserIds.length > 0) {
      query += ` OR m.user_id IN (${friendUserIds.map(() => '?').join(',')})`
      params.push(...friendUserIds)
    }
    
    query += `
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, offset)
    
    const stmt = momentsDb.prepare(query)
    const moments = stmt.all(...params)
    
    // 重新打开app.db来获取用户和NPC信息
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    // 获取每个朋友圈的点赞和评论详情
    const result = moments.map((moment: any) => {
      // 补充moment作者信息
      let user_name = null
      let user_nickname = null
      let user_avatar = null
      let npc_name = null
      let npc_avatar = null
      
      if (moment.user_id) {
        const user = appDb.prepare(`SELECT username, nickname, avatar FROM users WHERE id = ?`).get(moment.user_id) as any
        user_name = user?.username
        user_nickname = user?.nickname
        user_avatar = user?.avatar
      } else if (moment.npc_id) {
        const npc = appDb.prepare(`SELECT name, avatar FROM npcs WHERE id = ?`).get(moment.npc_id) as any
        npc_name = npc?.name
        npc_avatar = npc?.avatar
      }
      
      // 获取点赞列表
      const likesStmt = momentsDb.prepare(`
        SELECT * FROM moment_likes WHERE moment_id = ? ORDER BY created_at DESC
      `)
      const rawLikes = likesStmt.all(moment.id)
      
      const likes = rawLikes.map((like: any) => {
        if (like.user_id) {
          const user = appDb.prepare(`SELECT username, nickname FROM users WHERE id = ?`).get(like.user_id) as any
          return {
            ...like,
            user_name: user?.username,
            user_nickname: user?.nickname
          }
        } else if (like.npc_id) {
          const npc = appDb.prepare(`SELECT name FROM npcs WHERE id = ?`).get(like.npc_id) as any
          return {
            ...like,
            npc_name: npc?.name
          }
        }
        return like
      })
      
      // 获取评论列表
      const commentsStmt = momentsDb.prepare(`
        SELECT * FROM moment_comments WHERE moment_id = ? ORDER BY created_at ASC
      `)
      const rawComments = commentsStmt.all(moment.id)
      
      const comments = rawComments.map((comment: any) => {
        let commentData: any = { ...comment }
        
        // 评论者信息
        if (comment.user_id) {
          const user = appDb.prepare(`SELECT username, nickname, avatar FROM users WHERE id = ?`).get(comment.user_id) as any
          commentData.user_name = user?.username
          commentData.user_nickname = user?.nickname
          commentData.user_avatar = user?.avatar
        } else if (comment.npc_id) {
          const npc = appDb.prepare(`SELECT name, avatar FROM npcs WHERE id = ?`).get(comment.npc_id) as any
          commentData.npc_name = npc?.name
          commentData.npc_avatar = npc?.avatar
        }
        
        // 回复对象信息
        if (comment.reply_to_user_id) {
          const replyUser = appDb.prepare(`SELECT username, nickname FROM users WHERE id = ?`).get(comment.reply_to_user_id) as any
          commentData.reply_to_user_name = replyUser?.username
          commentData.reply_to_user_nickname = replyUser?.nickname
        } else if (comment.reply_to_npc_id) {
          const replyNpc = appDb.prepare(`SELECT name FROM npcs WHERE id = ?`).get(comment.reply_to_npc_id) as any
          commentData.reply_to_npc_name = replyNpc?.name
        }
        
        return commentData
      })
      
      return {
        ...moment,
        user_name,
        user_nickname,
        user_avatar,
        npc_name,
        npc_avatar,
        images: moment.images ? JSON.parse(moment.images) : [],
        likes,
        comments
      }
    })
    
    appDb.close()
    momentsDb.close()
    
    return result
  } finally {
    // db 在开头就关闭了
  }
}

// 点赞/取消点赞
export function toggleLike(momentId: number, userId?: number, npcId?: number) {
  const db = new Database(dbPath)
  
  try {
    // 检查是否已点赞
    const checkStmt = db.prepare(`
      SELECT id FROM moment_likes 
      WHERE moment_id = ? AND user_id = ? AND npc_id = ?
    `)
    const existing = checkStmt.get(momentId, userId || null, npcId || null)
    
    if (existing) {
      // 取消点赞
      const deleteStmt = db.prepare(`
        DELETE FROM moment_likes WHERE id = ?
      `)
      deleteStmt.run((existing as any).id)
      return { liked: false }
    } else {
      // 点赞
      const insertStmt = db.prepare(`
        INSERT INTO moment_likes (moment_id, user_id, npc_id)
        VALUES (?, ?, ?)
      `)
      insertStmt.run(momentId, userId || null, npcId || null)
      return { liked: true }
    }
  } finally {
    db.close()
  }
}

// 添加评论
export function addComment(data: {
  moment_id: number
  user_id?: number
  npc_id?: number
  reply_to_user_id?: number
  reply_to_npc_id?: number
  content: string
}) {
  const db = new Database(dbPath)
  
  try {
    const stmt = db.prepare(`
      INSERT INTO moment_comments 
      (moment_id, user_id, npc_id, reply_to_user_id, reply_to_npc_id, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      data.moment_id,
      data.user_id || null,
      data.npc_id || null,
      data.reply_to_user_id || null,
      data.reply_to_npc_id || null,
      data.content
    )
    
    return result.lastInsertRowid
  } finally {
    db.close()
  }
}

// 获取未读朋友圈数量
export function getUnreadCount(userId: number, roomId: string) {
  const db = new Database(dbPath)
  
  try {
    // 获取上次阅读时间
    const readStmt = db.prepare(`
      SELECT last_read_at FROM moment_read_status
      WHERE user_id = ? AND room_id = ?
    `)
    const readStatus = readStmt.get(userId, roomId) as any
    
    if (!readStatus) {
      // 从未读取过，返回总数
      const countStmt = db.prepare(`
        SELECT COUNT(*) as count FROM moments WHERE room_id = ?
      `)
      const result = countStmt.get(roomId) as any
      return result.count
    }
    
    // 返回上次阅读后的新朋友圈数量
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM moments 
      WHERE room_id = ? AND created_at > ?
    `)
    const result = countStmt.get(roomId, readStatus.last_read_at) as any
    return result.count
  } finally {
    db.close()
  }
}

// 标记已读
export function markAsRead(userId: number, roomId: string) {
  const db = new Database(dbPath)
  
  try {
    const stmt = db.prepare(`
      INSERT INTO moment_read_status (user_id, room_id, last_read_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, room_id) 
      DO UPDATE SET last_read_at = CURRENT_TIMESTAMP
    `)
    
    stmt.run(userId, roomId)
  } finally {
    db.close()
  }
}

// 获取朋友圈详情（用于AI生成评论时的上下文）
export function getMomentDetail(momentId: number) {
  const chatDb = new Database(dbPath)
  const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
  
  try {
    // 先从chat.db获取朋友圈基本信息
    const stmt = chatDb.prepare(`
      SELECT * FROM moments WHERE id = ?
    `)
    
    const moment = stmt.get(momentId) as any
    
    if (!moment) return null
    
    // 补充用户或NPC信息
    let user_name = null
    let user_nickname = null
    let npc_name = null
    let personality = null
    let habits = null
    let background = null
    
    if (moment.user_id) {
      const user = appDb.prepare(`SELECT username, nickname FROM users WHERE id = ?`).get(moment.user_id) as any
      user_name = user?.username
      user_nickname = user?.nickname
    } else if (moment.npc_id) {
      const npc = appDb.prepare(`SELECT name, personality, habits, background FROM npcs WHERE id = ?`).get(moment.npc_id) as any
      npc_name = npc?.name
      personality = npc?.personality
      habits = npc?.habits
      background = npc?.background
    }
    
    // 获取评论
    const commentsStmt = chatDb.prepare(`
      SELECT * FROM moment_comments WHERE moment_id = ? ORDER BY created_at ASC
    `)
    const rawComments = commentsStmt.all(momentId)
    
    // 补充评论者信息
    const comments = rawComments.map((comment: any) => {
      let commentUser = null
      let commentNpc = null
      
      if (comment.user_id) {
        commentUser = appDb.prepare(`SELECT username, nickname FROM users WHERE id = ?`).get(comment.user_id) as any
      } else if (comment.npc_id) {
        commentNpc = appDb.prepare(`SELECT name, personality, habits FROM npcs WHERE id = ?`).get(comment.npc_id) as any
      }
      
      return {
        ...comment,
        user_name: commentUser?.username,
        user_nickname: commentUser?.nickname,
        npc_name: commentNpc?.name,
        personality: commentNpc?.personality,
        habits: commentNpc?.habits
      }
    })
    
    return {
      ...moment,
      user_name,
      user_nickname,
      npc_name,
      personality,
      habits,
      background,
      images: moment.images ? JSON.parse(moment.images) : [],
      comments
    }
  } finally {
    chatDb.close()
    appDb.close()
  }
}

// 获取房间内的所有NPC
export function getRoomNPCs(roomId: string) {
  const db = new Database(join(process.cwd(), 'data', 'app.db'))
  
  try {
    const stmt = db.prepare(`
      SELECT DISTINCT n.* 
      FROM npcs n
      WHERE n.room_id = ?
    `)
    
    return stmt.all(roomId)
  } finally {
    db.close()
  }
}

