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
  
  // 获取房间信息（先查看房间是否存在）
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
  
  // 检查是否是房间成员
  const member = db.prepare(
    'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?'
  ).get(roomId, user.id) as any
  
  // 获取成员列表
  const members = db.prepare(`
    SELECT rm.*, u.nickname, u.avatar
    FROM room_members rm
    JOIN users u ON rm.user_id = u.id
    WHERE rm.room_id = ?
  `).all(roomId)
  
  // 是否是创建者
  const isCreator = room.creator_id === user.id
  
  // 是否是成员
  const isMember = !!member
  
  return {
    success: true,
    room,
    npcs,
    members,
    isCreator,
    isMember,
    myMember: member || null
  }
})

