import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { roomId, roleName, roleProfile } = body
  
  if (!roomId) {
    return { success: false, error: '请提供房间ID' }
  }
  
  const db = getDB()
  
  // 检查房间是否存在
  const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId)
  if (!room) {
    return { success: false, error: '房间不存在' }
  }
  
  // 检查是否已加入
  const existing = db.prepare(
    'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?'
  ).get(roomId, user.id)
  
  if (existing) {
    return { success: false, error: '已经加入该房间' }
  }
  
  // 加入房间
  try {
    db.prepare(
      'INSERT INTO room_members (room_id, user_id, role_name, role_profile) VALUES (?, ?, ?, ?)'
    ).run(roomId, user.id, roleName || null, roleProfile || null)
    
    return { success: true }
  } catch (error) {
    console.error('加入房间失败:', error)
    return { success: false, error: '加入房间失败' }
  }
})

