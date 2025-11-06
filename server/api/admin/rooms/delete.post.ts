import { getDB } from '~/server/utils/db'
import { getCurrentUser } from '~/server/utils/auth'
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { success: false, error: '请先登录' }
  }
  
  const body = await readBody(event)
  const { roomId } = body
  
  if (!roomId) {
    return { success: false, error: '请提供房间ID' }
  }
  
  const appDb = getDB()
  const chatDbPath = join(process.cwd(), 'data', 'chat.db')
  const chatDb = new Database(chatDbPath)
  
  try {
    // 检查房间是否存在
    const room = appDb.prepare('SELECT id, name FROM rooms WHERE id = ?').get(roomId) as any
    if (!room) {
      return { success: false, error: '房间不存在' }
    }
    
    // 开始事务删除
    appDb.prepare('BEGIN').run()
    chatDb.prepare('BEGIN').run()
    
    try {
      // 1. 删除 app.db 中的数据
      
      // 删除房间成员
      const deletedMembers = appDb.prepare('DELETE FROM room_members WHERE room_id = ?').run(roomId)
      console.log(`删除了 ${deletedMembers.changes} 个房间成员`)
      
      // 删除NPC
      const deletedNPCs = appDb.prepare('DELETE FROM npcs WHERE room_id = ?').run(roomId)
      console.log(`删除了 ${deletedNPCs.changes} 个NPC`)
      
      // 删除房间
      const deletedRoom = appDb.prepare('DELETE FROM rooms WHERE id = ?').run(roomId)
      console.log(`删除了房间: ${room.name}`)
      
      // 2. 删除 chat.db 中的消息数据
      
      // 检查 messages 表是否存在
      const tableCheck = chatDb.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='messages'
      `).get()
      
      if (tableCheck) {
        const deletedMessages = chatDb.prepare('DELETE FROM messages WHERE room_id = ?').run(roomId)
        console.log(`删除了 ${deletedMessages.changes} 条消息`)
      }
      
      // 提交事务
      appDb.prepare('COMMIT').run()
      chatDb.prepare('COMMIT').run()
      
      return {
        success: true,
        message: `已删除房间「${room.name}」及其所有相关数据`,
        deleted: {
          room: 1,
          members: deletedMembers.changes,
          npcs: deletedNPCs.changes,
          messages: tableCheck ? (chatDb.prepare('SELECT changes()').get() as any).changes : 0
        }
      }
    } catch (error) {
      // 回滚事务
      try {
        appDb.prepare('ROLLBACK').run()
        chatDb.prepare('ROLLBACK').run()
      } catch (e) {
        console.error('回滚失败:', e)
      }
      throw error
    }
  } catch (error) {
    console.error('删除房间失败:', error)
    return { success: false, error: '删除失败' }
  } finally {
    chatDb.close()
  }
})

