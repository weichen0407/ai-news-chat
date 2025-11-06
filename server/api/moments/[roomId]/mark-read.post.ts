/**
 * 标记朋友圈已读
 */
import { markAsRead } from '~/server/utils/db-moments'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'roomId')
    const body = await readBody(event)
    const { user_id } = body
    
    if (!roomId || !user_id) {
      throw new Error('房间ID和用户ID不能为空')
    }
    
    markAsRead(user_id, roomId)
    
    return {
      success: true
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

