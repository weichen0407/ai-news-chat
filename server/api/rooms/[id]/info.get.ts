import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const roomId = event.context.params?.id
  if (!roomId) {
    return { success: false, error: '房间ID不存在' }
  }
  
  const db = getDB()
  
  // 检查是否是房间成员
  const member = db.prepare(
    'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?'
  ).get(roomId, user.id) as any
  
  if (!member) {
    return { success: false, error: '你不是该房间成员' }
  }
  
  // 获取房间信息
  const room = db.prepare(`
    SELECT r.*, u.nickname as creator_name
    FROM rooms r
    JOIN users u ON r.creator_id = u.id
    WHERE r.id = ?
  `).get(roomId) as any
  
  if (!room) {
    return { success: false, error: '房间不存在' }
  }
  
  // 获取NPC列表
  const npcs = db.prepare(
    'SELECT * FROM npcs WHERE room_id = ?'
  ).all(roomId)
  
  // 获取成员列表
  const members = db.prepare(`
    SELECT rm.*, u.nickname, u.avatar
    FROM room_members rm
    JOIN users u ON rm.user_id = u.id
    WHERE rm.room_id = ?
  `).all(roomId)
  
  // 是否是创建者
  const isCreator = room.creator_id === user.id
  
  return {
    success: true,
    room,
    npcs,
    members,
    isCreator,
    myMember: member
  }
})

