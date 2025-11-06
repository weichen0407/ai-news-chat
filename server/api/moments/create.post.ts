/**
 * 创建朋友圈（玩家发布）
 */
import { createMoment } from '~/server/utils/db-moments'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { user_id, content, images } = body
    
    if (!content) {
      throw new Error('内容不能为空')
    }
    
    if (!user_id) {
      throw new Error('用户ID不能为空')
    }
    
    const momentId = createMoment({
      user_id,
      content,
      images
    })
    
    // 触发NPC自动评论（异步，不等待）
    // 获取用户的所有好友NPC并触发评论
    setTimeout(async () => {
      try {
        await $fetch('/api/moments/ai-auto-comment-friends', {
          method: 'POST',
          body: { moment_id: momentId, user_id }
        })
      } catch (error) {
        console.error('NPC自动评论失败:', error)
      }
    }, Math.random() * 5000 + 3000) // 3-8秒后随机开始
    
    return {
      success: true,
      momentId
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

