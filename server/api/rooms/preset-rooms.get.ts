import { getDB } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const db = getDB()
  
  try {
    // 获取所有预设房间（由jerry创建的房间）
    const rooms = db.prepare(`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.avatar,
        r.event_background,
        COUNT(DISTINCT rm.user_id) as member_count,
        COUNT(DISTINCT n.id) as npc_count,
        (
          SELECT sender_name || ': ' || content
          FROM messages 
          WHERE room_id = r.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages 
          WHERE room_id = r.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN npcs n ON r.id = n.room_id
      WHERE r.creator_id = (SELECT id FROM users WHERE username = 'jerry')
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT 20
    `).all()
    
    return {
      success: true,
      rooms: rooms.map((room: any) => ({
        ...room,
        type: '预设剧本',
        players: `${room.member_count}人 ${room.npc_count}NPC`
      }))
    }
  } catch (error) {
    console.error('获取预设房间失败:', error)
    return { success: false, error: '获取失败' }
  }
})

