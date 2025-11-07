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
    
    console.log(`📸 用户 ${user_id} 发布朋友圈，ID: ${momentId}`)
    
    // 触发NPC自动评论（异步，不等待）
    // 缩短延迟，让评论更快出现
    setTimeout(async () => {
      try {
        const response = await $fetch('/api/moments/ai-auto-comment-friends', {
          method: 'POST',
          body: { moment_id: momentId, user_id }
        })
        
        if (response.success) {
          console.log(`✅ 自动评论触发成功: ${response.count || 0} 个NPC将评论`)
          if (response.npcNames) {
            console.log(`   评论的NPC: ${response.npcNames.join(', ')}`)
          }
        } else {
          console.log(`⚠️ 自动评论响应: ${response.message}`)
        }
      } catch (error) {
        console.error('❌ NPC自动评论失败:', error)
      }
    }, Math.random() * 2000 + 1000) // 1-3秒后触发（之前是3-8秒）
    
    return {
      success: true,
      momentId
    }
  } catch (error: any) {
    console.error('❌ 创建朋友圈失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})
