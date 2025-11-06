import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUser(event)
    if (!user) {
      return { success: false, error: '请先登录' }
    }
    
    const roomId = event.context.params?.roomId
    if (!roomId) {
      return { success: false, error: '房间ID不存在' }
    }
    
    // 获取分页参数
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 50 // 默认每次加载50条
    const beforeId = query.beforeId ? parseInt(query.beforeId as string) : null // 在此消息ID之前的消息
    
    const db = getDB()
    
    // 检查房间是否存在
    const room = db.prepare('SELECT creator_id FROM rooms WHERE id = ?').get(roomId) as any
    if (!room) {
      return { success: false, error: '房间不存在' }
    }
    
    // 获取 jerry 用户的 ID
    const jerryUser = db.prepare('SELECT id FROM users WHERE username = ?').get('jerry') as any
    const isPresetRoom = jerryUser && room.creator_id === jerryUser.id
    
    // 检查是否是房间成员（预设房间除外）
    if (!isPresetRoom) {
      const member = db.prepare(
        'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?'
      ).get(roomId, user.id)
      
      if (!member) {
        return { success: false, error: '你不是该房间成员' }
      }
    }
    
    // 构建查询语句
    let sql = `
      SELECT 
        m.*,
        CASE 
          WHEN m.sender_type = 'user' THEN u.avatar
          ELSE m.avatar
        END as current_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
      WHERE m.room_id = ?
    `
    
    const params: any[] = [roomId]
    
    // 如果指定了beforeId，只获取该消息之前的消息
    if (beforeId) {
      sql += ` AND m.id < ?`
      params.push(beforeId)
    }
    
    sql += ` ORDER BY m.created_at DESC LIMIT ?`
    params.push(limit)
    
    const messages = db.prepare(sql).all(...params)
    
    // 反转顺序（因为我们用DESC查询，但要按时间正序显示）
    messages.reverse()
    
    // 将 current_avatar 替换为 avatar
    const messagesWithCurrentAvatar = messages.map((msg: any) => ({
      ...msg,
      avatar: msg.current_avatar || msg.avatar
    }))
    
    // 检查是否还有更多历史消息
    let hasMore = false
    if (beforeId && messages.length > 0) {
      const firstMessageId = messages[0]?.id
      if (firstMessageId) {
        const hasMoreResult = db.prepare('SELECT COUNT(*) as count FROM messages WHERE room_id = ? AND id < ?')
          .get(roomId, firstMessageId) as any
        hasMore = hasMoreResult.count > 0
      }
    }
    
    return {
      success: true,
      messages: messagesWithCurrentAvatar,
      hasMore
    }
  } catch (error) {
    console.error('获取消息失败:', error)
    return { 
      success: false, 
      error: '获取消息失败: ' + (error instanceof Error ? error.message : '未知错误')
    }
  }
})

