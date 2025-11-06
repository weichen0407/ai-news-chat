import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { roomId, content } = body
  
  if (!roomId || !content) {
    return { success: false, error: '缺少必要参数' }
  }
  
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
  let member = null
  if (!isPresetRoom) {
    member = db.prepare(
      'SELECT role_name FROM room_members WHERE room_id = ? AND user_id = ?'
    ).get(roomId, user.id) as any
    
    if (!member) {
      return { success: false, error: '你不是该房间成员' }
    }
  } else {
    // 预设房间：尝试获取成员信息，如果没有则使用用户默认信息
    member = db.prepare(
      'SELECT role_name FROM room_members WHERE room_id = ? AND user_id = ?'
    ).get(roomId, user.id) as any
  }
  
  // 插入消息
  try {
    db.prepare(
      'INSERT INTO messages (room_id, sender_type, sender_id, sender_name, avatar, content) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      roomId,
      'user',
      user.id,
      member?.role_name || user.nickname,
      user.avatar || null,
      content
    )
    
    return { success: true }
  } catch (error) {
    console.error('发送消息失败:', error)
    return { success: false, error: '发送消息失败' }
  }
})

