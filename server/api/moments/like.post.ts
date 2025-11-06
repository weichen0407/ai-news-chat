/**
 * 点赞/取消点赞
 */
import { toggleLike } from '~/server/utils/db-moments'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { moment_id, user_id, npc_id } = body
    
    if (!moment_id) {
      throw new Error('朋友圈ID不能为空')
    }
    
    if (!user_id && !npc_id) {
      throw new Error('用户ID或NPC ID至少提供一个')
    }
    
    const result = toggleLike(moment_id, user_id, npc_id)
    
    return {
      success: true,
      ...result
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

