/**
 * 好友NPC自动评论玩家的朋友圈（优化版）
 */
import Database from 'better-sqlite3'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { moment_id, user_id } = body
    
    if (!moment_id || !user_id) {
      throw new Error('朋友圈ID和用户ID不能为空')
    }
    
    console.log(`🤖 触发好友NPC自动评论: moment=${moment_id}, user=${user_id}`)
    
    // 获取用户的所有好友NPC
    const appDb = new Database(join(process.cwd(), 'data', 'app.db'))
    
    const friendNpcsStmt = appDb.prepare(`
      SELECT DISTINCT n.id, n.name, n.profile
      FROM npcs n
      INNER JOIN room_members rm ON n.room_id = rm.room_id
      WHERE rm.user_id = ?
    `)
    const friendNpcs = friendNpcsStmt.all(user_id)
    
    appDb.close()
    
    if (friendNpcs.length === 0) {
      console.log('⚠️ 该用户没有好友NPC')
      return { success: true, message: '该用户没有好友NPC', count: 0 }
    }
    
    console.log(`👥 用户有 ${friendNpcs.length} 个好友NPC:`, friendNpcs.map((npc: any) => npc.name).join(', '))
    
    // 提高概率：每个NPC有60%的概率评论（之前是40%）
    // 至少保证有1个NPC会评论
    const commentingNPCs = friendNpcs.filter(() => Math.random() > 0.4)
    
    // 如果随机后没有NPC，强制至少选一个
    if (commentingNPCs.length === 0 && friendNpcs.length > 0) {
      const randomIndex = Math.floor(Math.random() * friendNpcs.length)
      commentingNPCs.push(friendNpcs[randomIndex])
      console.log('🎯 随机选择了至少一个NPC评论')
    }
    
    console.log(`💬 ${commentingNPCs.length} 个NPC将评论:`, commentingNPCs.map((npc: any) => npc.name).join(', '))
    
    // 缩短延迟时间，让评论更快出现
    for (let i = 0; i < commentingNPCs.length; i++) {
      const npc = commentingNPCs[i]
      const delay = Math.random() * 5000 + 1000 // 1-6秒随机延迟（之前是2-12秒）
      
      setTimeout(async () => {
        try {
          const response = await $fetch('/api/moments/ai-comment', {
            method: 'POST',
            body: {
              moment_id,
              npc_id: (npc as any).id
            }
          })
          
          if (response.success) {
            console.log(`✅ ${(npc as any).name} 已评论: ${response.comment?.substring(0, 20)}...`)
          } else {
            console.error(`❌ ${(npc as any).name} 评论失败:`, response.error)
          }
        } catch (error) {
          console.error(`❌ ${(npc as any).name} 评论失败:`, error)
        }
      }, delay)
    }
    
    return {
      success: true,
      message: `已触发 ${commentingNPCs.length} 个NPC评论`,
      count: commentingNPCs.length,
      npcNames: commentingNPCs.map((npc: any) => npc.name)
    }
    
  } catch (error: any) {
    console.error('❌ 自动评论失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})
