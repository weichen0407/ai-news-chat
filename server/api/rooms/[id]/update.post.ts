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
  
  const body = await readBody(event)
  const { name, description, event_background, dialogue_density, avatar, npcs } = body
  
  const db = getDB()
  
  // 检查是否是群主
  const room = db.prepare('SELECT creator_id FROM rooms WHERE id = ?').get(roomId) as any
  if (!room || room.creator_id !== user.id) {
    return { success: false, error: '只有群主可以修改设置' }
  }
  
  try {
    // 更新房间信息
    db.prepare(`
      UPDATE rooms 
      SET name = ?, description = ?, event_background = ?, dialogue_density = ?, avatar = ?
      WHERE id = ?
    `).run(name, description || '', event_background || '', dialogue_density || 2, avatar || '聊', roomId)
    
    // 更新NPC
    if (npcs && npcs.length > 0) {
      // 更新每个NPC的persona
      const updateNPC = db.prepare(
        'UPDATE npcs SET profile = ? WHERE id = ? AND room_id = ?'
      )
      
      for (const npc of npcs) {
        if (npc.id) {
          // 更新现有NPC
          updateNPC.run(npc.persona || npc.profile || '', npc.id, roomId)
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('更新房间失败:', error)
    return { success: false, error: '更新失败' }
  }
})

