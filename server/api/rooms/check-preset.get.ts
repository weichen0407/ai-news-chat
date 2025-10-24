import { getDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { presetId } = query
  
  if (!presetId) {
    return { exists: false }
  }
  
  const db = getDB()
  const room = db.prepare('SELECT id FROM rooms WHERE preset_id = ?').get(presetId) as any
  
  if (room) {
    return {
      exists: true,
      roomId: room.id
    }
  }
  
  return { exists: false }
})

