import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { name, description, eventBackground, npcs, presetId, dialogueDensity, avatar } = body
  
  if (!name || !eventBackground) {
    return { success: false, error: '请填写房间名称和事件背景' }
  }
  
  const db = getDB()
  const roomId = generateRoomId()
  
  try {
    // 创建房间（支持preset_id）
    db.prepare(
      'INSERT INTO rooms (id, name, description, event_background, dialogue_density, avatar, preset_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(roomId, name, description || '', eventBackground, dialogueDensity || 2, avatar || '聊', presetId || null, user.id)
    
    // 添加NPC
    if (npcs && npcs.length > 0) {
      const insertNPC = db.prepare(
        'INSERT INTO npcs (room_id, name, avatar, profile) VALUES (?, ?, ?, ?)'
      )
      
      for (const npc of npcs) {
        insertNPC.run(roomId, npc.name, npc.avatar || null, npc.profile)
      }
    }
    
    // 注意：创建者需要在第一次进入时选择人设，所以这里不自动加入
    
    return {
      success: true,
      roomId
    }
  } catch (error) {
    console.error('创建房间失败:', error)
    return { success: false, error: '创建房间失败' }
  }
})

