/**
 * 获取未读朋友圈数量
 */
import { getUnreadCount } from '~/server/utils/db-moments'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'roomId')
    const query = getQuery(event)
    const userId = Number(query.userId)
    
    if (!roomId || !userId) {
      throw new Error('房间ID和用户ID不能为空')
    }
    
    const unreadCount = getUnreadCount(userId, roomId)
    
    return {
      success: true,
      unreadCount
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

