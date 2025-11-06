/**
 * NPC自动评论玩家的朋友圈
 * 当玩家发布朋友圈后，房间内的所有NPC会根据人设随机评论
 */
import { getRoomNPCs } from '~/server/utils/db-moments'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { moment_id, room_id } = body
    
    if (!moment_id || !room_id) {
      throw new Error('朋友圈ID和房间ID不能为空')
    }
    
    console.log(`🤖 触发NPC自动评论: moment=${moment_id}, room=${room_id}`)
    
    // 获取房间内的所有NPC
    const npcs = getRoomNPCs(room_id)
    
    if (npcs.length === 0) {
      console.log('该房间没有NPC')
      return { success: true, message: '该房间没有NPC' }
    }
    
    console.log(`- 房间有 ${npcs.length} 个NPC`)
    
    // 每个NPC有50%的概率评论
    const commentingNPCs = npcs.filter(() => Math.random() > 0.5)
    
    console.log(`- ${commentingNPCs.length} 个NPC将评论`)
    
    // 延迟评论，模拟真实情况
    for (let i = 0; i < commentingNPCs.length; i++) {
      const npc = commentingNPCs[i]
      const delay = Math.random() * 10000 + 2000 // 2-12秒随机延迟
      
      setTimeout(async () => {
        try {
          await $fetch('/api/moments/ai-comment', {
            method: 'POST',
            body: {
              moment_id,
              npc_id: (npc as any).id
            }
          })
          console.log(`✅ ${(npc as any).name} 已评论`)
        } catch (error) {
          console.error(`❌ ${(npc as any).name} 评论失败:`, error)
        }
      }, delay)
    }
    
    return {
      success: true,
      message: `已触发 ${commentingNPCs.length} 个NPC评论`
    }
    
  } catch (error: any) {
    console.error('❌ 自动评论失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})

